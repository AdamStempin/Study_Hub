import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../services/task.service';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-tasks-page',
  imports: [FormsModule, RouterLink, SidebarComponent],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.css',
})
export class TasksPageComponent {
  readonly tasks = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly selectedTaskId = signal<string | null>(null);
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
      this.selectedTaskId.set(rawId);
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

  async saveTask(): Promise<void> {
    const task = this.selectedTask();
    if (!task) {
      return;
    }
    if (!await this.tasks.updateTask(
      task.id,
      this.taskForm.subject,
      this.taskForm.description,
      this.taskForm.dueDateTime,
    )) {
      this.formError = this.tasks.error()
        || 'Please enter a subject, description, and valid deadline.';
      return;
    }

    this.formError = '';
    this.savedNotice = 'Task updated.';
  }

  async toggleComplete(): Promise<void> {
    const task = this.selectedTask();
    if (task && !await this.tasks.toggleComplete(task.id)) {
      this.formError = this.tasks.error() || 'Could not update this task.';
    }
  }

  async deleteTask(): Promise<void> {
    const task = this.selectedTask();
    if (task && await this.tasks.deleteTask(task.id)) {
      await this.router.navigate(['/tasks']);
    } else if (task) {
      this.formError = this.tasks.error() || 'Could not delete this task.';
    }
  }

  private toLocalDateTimeValue(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
}
