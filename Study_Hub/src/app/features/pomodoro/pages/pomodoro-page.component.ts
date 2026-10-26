import { computed, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { PomodoroSettings } from '../models/pomodoro.models';
import { PomodoroTimerService } from '../services/pomodoro-timer.service';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

interface SubjectStudySummary {
  name: string;
  studySeconds: number;
  sessionCount: number;
  sharePercent: number;
}

@Component({
  selector: 'app-pomodoro-page',
  imports: [FormsModule, RouterLink, SidebarComponent],
  templateUrl: './pomodoro-page.component.html',
  styleUrl: './pomodoro-page.component.css',
})
export class PomodoroPageComponent {
  readonly timer = inject(PomodoroTimerService);
  readonly formattedTime = computed(() => {
    const seconds = this.timer.remainingSeconds();
    return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  });
  readonly timerProgress = computed(() => (
    this.timer.remainingSeconds() / this.timer.state().intervalDurationSeconds
  ) * 100);
  readonly focusCycleSteps = computed(() => Array.from(
    { length: this.timer.state().settings.intervalsBeforeLongBreak },
    (_, index) => index,
  ));
  readonly completedCycleIntervals = computed(() => (
    this.timer.state().completedWorkIntervals % this.focusCycleSteps().length
  ));
  readonly recentSessions = computed(() => [...this.timer.state().sessions].reverse().slice(0, 5));
  readonly subjectStudySummary = computed(() => {
    const subjects = new Map<string, { studySeconds: number; sessionCount: number }>();

    for (const session of this.timer.state().sessions) {
      const name = session.subject.trim() || 'Unassigned subject';
      const summary = subjects.get(name) ?? { studySeconds: 0, sessionCount: 0 };
      summary.studySeconds += session.durationSeconds;
      summary.sessionCount += 1;
      subjects.set(name, summary);
    }

    const totalSeconds = Array.from(subjects.values())
      .reduce((total, subject) => total + subject.studySeconds, 0);

    return Array.from(subjects, ([name, summary]): SubjectStudySummary => ({
      name,
      ...summary,
      sharePercent: totalSeconds === 0 ? 0 : Math.round((summary.studySeconds / totalSeconds) * 100),
    })).sort((first, second) => second.studySeconds - first.studySeconds);
  });
  readonly subjectStudyTotal = computed(() => this.subjectStudySummary()
    .reduce((total, subject) => total + subject.studySeconds, 0));

  settingsForm: PomodoroSettings = { ...this.timer.state().settings };

  get phaseLabel(): string {
    switch (this.timer.state().phase) {
      case 'work':
        return 'Focus session';
      case 'shortBreak':
        return 'Short break';
      case 'longBreak':
        return 'Long break';
    }
  }

  saveSettings(): void {
    this.timer.updateSettings({
      ...this.settingsForm,
      notificationsEnabled: this.timer.state().settings.notificationsEnabled,
      soundEnabled: this.timer.state().settings.soundEnabled,
    });
  }

  formatStudyTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  }

  formatSessionDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  }

  formatSessionDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
