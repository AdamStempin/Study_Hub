import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import type {
  CompletedFocusSession,
  PomodoroPhase,
  PomodoroSettings,
  PomodoroState,
  WeeklyStudyDay,
} from '../models/pomodoro.models';

function createInitialState(): PomodoroState {
  const settings: PomodoroSettings = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    intervalsBeforeLongBreak: 4,
    notificationsEnabled: false,
    soundEnabled: false,
  };

  return {
    phase: 'work',
    status: 'idle',
    settings,
    remainingSeconds: settings.workMinutes * 60,
    intervalDurationSeconds: settings.workMinutes * 60,
    endsAt: null,
    completedWorkIntervals: 0,
    subject: '',
    task: '',
    sessions: [],
  };
}

function isPositiveInteger(value: unknown, maximum: number): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 1 && value <= maximum;
}

function getPeriodStart(date: Date, period: 'day' | 'week' | 'month'): number {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  if (period === 'week') {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (period === 'month') {
    start.setDate(1);
  }

  return start.getTime();
}

@Injectable({ providedIn: 'root' })
export class PomodoroTimerService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateSignal = signal(createInitialState());
  private readonly currentDateKey = signal(new Date().toDateString());
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private dateCheckIntervalId: ReturnType<typeof setInterval> | null = null;
  private audioContext: AudioContext | null = null;
  private readonly visibilityListener = () => this.refresh();

  readonly state = this.stateSignal.asReadonly();
  readonly remainingSeconds = signal(createInitialState().remainingSeconds);
  readonly notice = signal('');

  readonly todayStudySeconds = computed(() => this.getStudySeconds('day'));
  readonly weekStudySeconds = computed(() => this.getStudySeconds('week'));
  readonly monthStudySeconds = computed(() => this.getStudySeconds('month'));
  readonly weeklyStudyDays = computed(() => {
    this.currentDateKey();
    const now = new Date();
    const todayStart = getPeriodStart(now, 'day');
    const weekStart = new Date(getPeriodStart(now, 'week'));
    const sessions = this.stateSignal().sessions;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      const start = getPeriodStart(date, 'day');
      const studySeconds = sessions.reduce(
        (total, session) => getPeriodStart(new Date(session.completedAt), 'day') === start
          ? total + session.durationSeconds
          : total,
        0,
      );

      return {
        date,
        studySeconds,
        isToday: start === todayStart,
        isFuture: start > todayStart,
      };
    });
    const maximumStudySeconds = Math.max(...days.map((day) => day.studySeconds));

    return days.map((day): WeeklyStudyDay => ({
      label: day.date.toLocaleDateString('en-US', { weekday: 'short' }),
      studySeconds: day.studySeconds,
      barHeightPercent: maximumStudySeconds === 0
        ? 0
        : Math.max(12, Math.round((day.studySeconds / maximumStudySeconds) * 88)),
      isToday: day.isToday,
      isFuture: day.isFuture,
    }));
  });
  readonly weekCompletedIntervals = computed(() => {
    this.currentDateKey();
    const weekStart = getPeriodStart(new Date(), 'week');
    return this.stateSignal().sessions.filter((session) => session.completedAt >= weekStart).length;
  });

  constructor() {
    this.refresh();
    this.dateCheckIntervalId = setInterval(() => this.updateCurrentDate(), 60_000);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityListener);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('visibilitychange', this.visibilityListener);
      });
    }

    this.destroyRef.onDestroy(() => {
      this.clearInterval();
      if (this.dateCheckIntervalId !== null) {
        clearInterval(this.dateCheckIntervalId);
      }
      if (this.audioContext !== null) {
        void this.audioContext.close().catch((error: unknown) => {
          console.error('Could not close the Pomodoro sound context.', error);
        });
      }
    });
  }

  start(): void {
    const current = this.stateSignal();
    if (current.status === 'running') {
      return;
    }

    if (current.settings.soundEnabled) {
      void this.resumeAudio();
    }

    const remaining = this.remainingSeconds();
    const nextState: PomodoroState = {
      ...current,
      status: 'running',
      remainingSeconds: remaining,
      endsAt: Date.now() + remaining * 1000,
    };
    this.stateSignal.set(nextState);
    this.startInterval();
  }

  pause(): void {
    this.refresh();
    const current = this.stateSignal();
    if (current.status !== 'running') {
      return;
    }

    this.stateSignal.set({
      ...current,
      status: 'paused',
      remainingSeconds: this.remainingSeconds(),
      endsAt: null,
    });
    this.clearInterval();
  }

  reset(): void {
    const current = this.stateSignal();
    const duration = this.getPhaseDuration(current.phase, current.settings);
    this.stateSignal.set({
      ...current,
      status: 'idle',
      remainingSeconds: duration,
      intervalDurationSeconds: duration,
      endsAt: null,
    });
    this.remainingSeconds.set(duration);
    this.clearInterval();
    this.setNotice('Timer bol resetovaný. Nedokončený interval sa nezapočítal.');
  }

  skip(): void {
    const current = this.stateSignal();
    const nextPhase = this.getNextPhase(current.phase, current.completedWorkIntervals, current.settings);
    const duration = this.getPhaseDuration(nextPhase, current.settings);
    this.stateSignal.set({
      ...current,
      phase: nextPhase,
      status: 'idle',
      remainingSeconds: duration,
      intervalDurationSeconds: duration,
      endsAt: null,
    });
    this.remainingSeconds.set(duration);
    this.clearInterval();
    this.setNotice('Interval bol preskočený. Nedokončený pracovný interval sa nezapočítal.');
  }

  updateSettings(settings: PomodoroSettings): void {
    const current = this.stateSignal();
    if (current.status === 'running') {
      this.setNotice('Pred zmenou dĺžky intervalu najprv pozastav timer.');
      return;
    }

    if (
      !isPositiveInteger(settings.workMinutes, 180)
      || !isPositiveInteger(settings.shortBreakMinutes, 60)
      || !isPositiveInteger(settings.longBreakMinutes, 120)
      || !isPositiveInteger(settings.intervalsBeforeLongBreak, 12)
      || settings.intervalsBeforeLongBreak < 2
    ) {
      this.setNotice('Skontroluj nastavenie: pracovný interval musí mať 1–180 min, prestávky 1–60/120 min a dlhá prestávka nasleduje po 2–12 intervaloch.');
      return;
    }

    const duration = this.getPhaseDuration(current.phase, settings);
    this.stateSignal.set({
      ...current,
      settings,
      status: 'idle',
      remainingSeconds: duration,
      intervalDurationSeconds: duration,
      endsAt: null,
    });
    this.remainingSeconds.set(duration);
    this.setNotice('Nastavenia timeru boli uložené.');
  }

  setSubject(subject: string): void {
    this.updateAssociation({ subject: subject.slice(0, 80) });
  }

  setTask(task: string): void {
    this.updateAssociation({ task: task.slice(0, 120) });
  }

  async enableNotifications(): Promise<void> {
    if (typeof Notification === 'undefined') {
      this.setNotice('Tento prehliadač nepodporuje systémové upozornenia.');
      return;
    }

    try {
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;

      const current = this.stateSignal();
      const enabled = permission === 'granted';
      this.stateSignal.set({
        ...current,
        settings: { ...current.settings, notificationsEnabled: enabled },
      });
      this.setNotice(enabled
        ? 'Upozornenia po skončení intervalu sú zapnuté.'
        : 'Upozornenia nie sú povolené. Môžeš ich povoliť v nastaveniach prehliadača.');
    } catch (error) {
      console.error('Could not enable Pomodoro notifications.', error);
      this.setNotice('Nepodarilo sa zapnúť systémové upozornenia.');
    }
  }

  disableNotifications(): void {
    const current = this.stateSignal();
    this.stateSignal.set({
      ...current,
      settings: { ...current.settings, notificationsEnabled: false },
    });
    this.setNotice('Systémové upozornenia sú vypnuté.');
  }

  async setSoundEnabled(enabled: boolean): Promise<void> {
    if (!enabled) {
      const current = this.stateSignal();
      this.stateSignal.set({
        ...current,
        settings: { ...current.settings, soundEnabled: false },
      });
      this.setNotice('Zvukové upozornenia sú vypnuté.');
      return;
    }

    if (!await this.resumeAudio()) {
      return;
    }

    const current = this.stateSignal();
    this.stateSignal.set({
      ...current,
      settings: { ...current.settings, soundEnabled: true },
    });
    this.setNotice('Zvukové upozornenia po skončení intervalu sú zapnuté.');
  }

  refresh(): void {
    this.updateCurrentDate();
    const current = this.stateSignal();
    if (current.status !== 'running' || current.endsAt === null) {
      return;
    }

    const remaining = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000));
    this.remainingSeconds.set(remaining);
    if (remaining === 0) {
      this.completeInterval();
    }
  }

  private updateAssociation(association: Partial<Pick<PomodoroState, 'subject' | 'task'>>): void {
    this.stateSignal.update((current) => ({ ...current, ...association }));
  }

  private getStudySeconds(period: 'day' | 'week' | 'month'): number {
    this.currentDateKey();
    const start = getPeriodStart(new Date(), period);
    return this.stateSignal().sessions.reduce(
      (total, session) => session.completedAt >= start ? total + session.durationSeconds : total,
      0,
    );
  }

  private getPhaseDuration(phase: PomodoroPhase, settings: PomodoroSettings): number {
    switch (phase) {
      case 'work':
        return settings.workMinutes * 60;
      case 'shortBreak':
        return settings.shortBreakMinutes * 60;
      case 'longBreak':
        return settings.longBreakMinutes * 60;
    }
  }

  private getNextPhase(
    phase: PomodoroPhase,
    completedWorkIntervals: number,
    settings: PomodoroSettings,
  ): PomodoroPhase {
    if (phase !== 'work') {
      return 'work';
    }

    return completedWorkIntervals > 0
      && completedWorkIntervals % settings.intervalsBeforeLongBreak === 0
      ? 'longBreak'
      : 'shortBreak';
  }

  private completeInterval(): void {
    const current = this.stateSignal();
    if (current.status !== 'running') {
      return;
    }

    const completedAt = current.endsAt ?? Date.now();
    const isWorkInterval = current.phase === 'work';
    const completedWorkIntervals = current.completedWorkIntervals + Number(isWorkInterval);
    const nextPhase = isWorkInterval
      ? this.getNextPhase('work', completedWorkIntervals, current.settings)
      : 'work';
    const duration = this.getPhaseDuration(nextPhase, current.settings);
    const sessions = isWorkInterval
      ? [
        ...current.sessions,
        {
          completedAt,
          durationSeconds: current.intervalDurationSeconds,
          subject: current.subject,
          task: current.task,
        },
      ]
      : current.sessions;

    this.stateSignal.set({
      ...current,
      phase: nextPhase,
      status: 'idle',
      remainingSeconds: duration,
      intervalDurationSeconds: duration,
      endsAt: null,
      completedWorkIntervals,
      sessions,
    });
    this.remainingSeconds.set(duration);
    this.clearInterval();

    const message = isWorkInterval
      ? `Pracovný interval dokončený. Nasleduje ${nextPhase === 'longBreak' ? 'dlhá' : 'krátka'} prestávka.`
      : 'Prestávka dokončená. Čas na ďalší pracovný interval.';
    this.setNotice(message);
    if (this.stateSignal().settings.soundEnabled) {
      void this.playCompletionSound();
    }
    this.showNotification(message);
  }

  private async playCompletionSound(): Promise<void> {
    if (!await this.resumeAudio()) {
      return;
    }

    const context = this.audioContext;
    if (context === null) {
      return;
    }

    try {
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      const endAt = context.currentTime + 0.35;
      oscillator.frequency.value = 880;
      volume.gain.setValueAtTime(0.12, context.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, endAt);
      oscillator.connect(volume);
      volume.connect(context.destination);
      oscillator.addEventListener('ended', () => {
        oscillator.disconnect();
        volume.disconnect();
      }, { once: true });
      oscillator.start();
      oscillator.stop(endAt);
    } catch (error) {
      console.error('Could not play the Pomodoro completion sound.', error);
      this.setNotice('Interval sa skončil, ale zvukové upozornenie sa nepodarilo prehrať.');
    }
  }

  private async resumeAudio(): Promise<boolean> {
    if (typeof AudioContext === 'undefined') {
      this.setNotice('Tento prehliadač nepodporuje zvukové upozornenia.');
      return false;
    }

    try {
      this.audioContext ??= new AudioContext();
      await this.audioContext.resume();
      return true;
    } catch (error) {
      console.error('Could not enable Pomodoro sound notifications.', error);
      this.setNotice('Nepodarilo sa zapnúť zvukové upozornenia.');
      return false;
    }
  }

  private showNotification(message: string): void {
    const current = this.stateSignal();
    if (!current.settings.notificationsEnabled || typeof Notification === 'undefined') {
      return;
    }

    if (Notification.permission !== 'granted') {
      this.setNotice('Interval sa skončil. Upozornenia povoľ v nastaveniach prehliadača.');
      return;
    }

    try {
      new Notification('StudyHub Timer', { body: message });
    } catch (error) {
      console.error('Could not show Pomodoro notification.', error);
      this.setNotice('Interval sa skončil, ale systémové upozornenie sa nepodarilo zobraziť.');
    }
  }

  private setNotice(message: string): void {
    this.notice.set(message);
  }

  private updateCurrentDate(): void {
    const currentDateKey = new Date().toDateString();
    if (currentDateKey !== this.currentDateKey()) {
      this.currentDateKey.set(currentDateKey);
    }
  }

  private startInterval(): void {
    this.clearInterval();
    this.intervalId = setInterval(() => this.refresh(), 250);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
