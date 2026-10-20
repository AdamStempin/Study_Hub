import { computed, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PomodoroSettings, PomodoroTimerService } from '../../pomodoro/pomodoro-timer.service';
import { StudyTask, TaskService } from '../../tasks/task.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  readonly timer = inject(PomodoroTimerService);
  readonly tasks = inject(TaskService);
  readonly todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
  readonly formattedTime = computed(() => {
    const seconds = this.timer.remainingSeconds();
    return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  });
  readonly timerProgress = computed(() => (
    this.timer.remainingSeconds() / this.timer.state().intervalDurationSeconds
  ) * 100);
  settingsOpen = false;
  settingsForm: PomodoroSettings = { ...this.timer.state().settings };
  addTaskOpen = false;
  taskFormError = '';
  minDateTime = this.toLocalDateTimeValue(new Date());
  newTask = { subject: '', description: '', dueDateTime: '' };

  openTimerSettings(): void {
    this.settingsForm = { ...this.timer.state().settings };
    this.settingsOpen = true;
  }

  closeTimerSettings(): void {
    this.settingsOpen = false;
  }

  saveTimerSettings(): void {
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

  formatStudyHours(seconds: number): string {
    return (seconds / 3600).toFixed(1);
  }

  openAddTask(): void {
    this.minDateTime = this.toLocalDateTimeValue(new Date());
    this.taskFormError = '';
    this.addTaskOpen = true;
  }

  closeAddTask(): void {
    this.addTaskOpen = false;
    this.taskFormError = '';
    this.newTask = { subject: '', description: '', dueDateTime: '' };
  }

  onTaskModalBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeAddTask();
    }
  }

  addStudyTask(): void {
    if (!this.tasks.addTask(this.newTask.subject, this.newTask.description, this.newTask.dueDateTime)) {
      this.taskFormError = 'Please enter a subject, description, and valid deadline.';
      return;
    }

    this.closeAddTask();
  }

  formatTaskDeadline(task: StudyTask): string {
    const dueDate = new Date(task.dueAt);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dateLabel = dueDate.toDateString() === today.toDateString()
      ? 'Today'
      : dueDate.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${dateLabel} · ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  taskDueClass(task: StudyTask): string {
    const dueDate = new Date(task.dueAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / 86_400_000);

    if (task.dueAt < Date.now()) {
      return 'due-overdue';
    }
    if (daysUntilDue === 0) {
      return 'due-today';
    }
    if (daysUntilDue <= 2) {
      return 'due-soon';
    }
    if (daysUntilDue <= 7) {
      return 'due-week';
    }
    return 'due-later';
  }

  private toLocalDateTimeValue(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
}
