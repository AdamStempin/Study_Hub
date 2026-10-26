import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-tasks-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.css',
})
export class TasksPageComponent {
  readonly tasks = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly selectedTaskId = signal<number | null>(null);
  readonly selectedTask = computed(() => {
    const id = this.selectedTaskId();
    return id === null ? undefined : this.tasks.tasks().find((task) => task.id === id);
  });
  readonly isDetailPage = computed(() => this.selectedTaskId() !== null);

  taskForm = { subject: '', description: '', dueDateTime: '' };
  formError = '';
  savedNotice = '';
  minDateTime = this.toLocalDateTimeValue(new Date());

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const rawId = params.get('id');
      const id = rawId === null ? null : Number(rawId);
      this.selectedTaskId.set(id !== null && Number.isInteger(id) ? id : null);
      const task = this.selectedTask();
      this.formError = '';
      this.savedNotice = '';

      if (task) {
        this.taskForm = {
          subject: task.subject,
          description: task.description,
          dueDateTime: this.toLocalDateTimeValue(new Date(task.dueAt)),
        };
      }
    });
  }

  formatDeadline(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  saveTask(): void {
    const task = this.selectedTask();
    if (!task || !this.tasks.updateTask(
      task.id,
      this.taskForm.subject,
      this.taskForm.description,
      this.taskForm.dueDateTime,
    )) {
      this.formError = 'Please enter a subject, description, and valid deadline.';
      return;
    }

    this.formError = '';
    this.savedNotice = 'Task updated.';
  }

  toggleComplete(): void {
    const task = this.selectedTask();
    if (task) {
      this.tasks.toggleComplete(task.id);
    }
  }

  deleteTask(): void {
    const task = this.selectedTask();
    if (task) {
      this.tasks.deleteTask(task.id);
      void this.router.navigate(['/tasks']);
    }
  }

  private toLocalDateTimeValue(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
}
