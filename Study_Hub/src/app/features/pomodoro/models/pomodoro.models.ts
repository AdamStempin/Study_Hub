export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  intervalsBeforeLongBreak: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface CompletedFocusSession {
  completedAt: number;
  durationSeconds: number;
  subject: string;
  task: string;
}

export interface WeeklyStudyDay {
  label: string;
  studySeconds: number;
  barHeightPercent: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface PomodoroState {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  settings: PomodoroSettings;
  remainingSeconds: number;
  intervalDurationSeconds: number;
  endsAt: number | null;
  completedWorkIntervals: number;
  subject: string;
  task: string;
  sessions: CompletedFocusSession[];
}
