import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type { Unsubscribe } from 'firebase/firestore';
import { FirebaseAuthService } from '../../../core/services/firebase-auth.service';
import type { StudyTask } from '../models/study-task.model';
import { FirestoreTaskRepository } from './firestore-task.repository';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly auth = inject(FirebaseAuthService);
  private readonly repository = inject(FirestoreTaskRepository);
  private readonly taskSignal = signal<StudyTask[]>([]);
  private activeUserId: string | null = null;

  readonly tasks = this.taskSignal.asReadonly();
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly upcomingTasks = computed(() => [...this.taskSignal()].sort((left, right) => {
    if ((left.completedAt === null) !== (right.completedAt === null)) {
      return left.completedAt === null ? -1 : 1;
    }
    return left.dueAt - right.dueAt;
  }));
  readonly activeSubjectCount = computed(() => new Set(
    this.taskSignal()
      .filter((task) => task.completedAt === null)
      .map((task) => task.subject.trim().toLocaleLowerCase()),
  ).size);
  readonly tasksDueToday = computed(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.taskSignal().filter(
      (task) => task.completedAt === null && task.dueAt >= start.getTime() && task.dueAt < end.getTime(),
    ).length;
  });
  readonly upcomingDeadlineCount = computed(() => this.taskSignal().filter((task) => task.completedAt === null).length);
  readonly completedThisWeek = computed(() => {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const start = weekStart.getTime();

    return this.taskSignal().filter(
      (task) => task.completedAt !== null && task.completedAt >= start,
    ).length;
  });

  constructor() {
    effect((onCleanup) => {
      const user = this.auth.user();
      this.activeUserId = user?.uid ?? null;
      this.taskSignal.set([]);
      this.error.set('');

      if (!user) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      const unsubscribe: Unsubscribe = this.repository.watch(
        user.uid,
        (tasks) => {
          if (this.activeUserId !== user.uid) {
            return;
          }
          this.taskSignal.set(tasks);
          this.error.set('');
          this.isLoading.set(false);
        },
        (error) => {
          console.error('Could not read the signed-in user tasks from Firestore.', error);
          this.error.set('Could not load your tasks. Check your connection and Firestore rules.');
          this.isLoading.set(false);
        },
      );
      onCleanup(unsubscribe);
    });
  }

  async addTask(subject: string, description: string, dueDateTime: string): Promise<boolean> {
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();
    const dueAt = new Date(dueDateTime).getTime();

    if (!cleanSubject || !cleanDescription || !Number.isFinite(dueAt) || dueAt < Date.now()) {
      return false;
    }

    const userId = this.getUserId();
    if (!userId) {
      return false;
    }

    try {
      await this.repository.create(userId, {
        subject: cleanSubject,
        description: cleanDescription,
        dueAt,
        completedAt: null,
      });
      this.error.set('');
      return true;
    } catch (error) {
      this.reportWriteError('create', error);
      return false;
    }
  }

  async toggleComplete(id: string): Promise<boolean> {
    const task = this.taskSignal().find((item) => item.id === id);
    if (!task) {
      return false;
    }

    return this.updateTaskData(id, {
      completedAt: task.completedAt === null ? Date.now() : null,
    });
  }

  async updateTask(
    id: string,
    subject: string,
    description: string,
    dueDateTime: string,
  ): Promise<boolean> {
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();
    const dueAt = new Date(dueDateTime).getTime();

    if (!cleanSubject || !cleanDescription || !Number.isFinite(dueAt)) {
      return false;
    }

    return this.updateTaskData(id, {
      subject: cleanSubject,
      description: cleanDescription,
      dueAt,
    });
  }

  async deleteTask(id: string): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) {
      return false;
    }

    try {
      await this.repository.delete(userId, id);
      this.error.set('');
      return true;
    } catch (error) {
      this.reportWriteError('delete', error);
      return false;
    }
  }

  private async updateTaskData(
    id: string,
    changes: Partial<Omit<StudyTask, 'id'>>,
  ): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) {
      return false;
    }

    try {
      await this.repository.update(userId, id, changes);
      this.error.set('');
      return true;
    } catch (error) {
      this.reportWriteError('update', error);
      return false;
    }
  }

  private getUserId(): string | null {
    const userId = this.auth.user()?.uid ?? null;
    if (!userId) {
      this.error.set('Sign in before managing tasks.');
    }
    return userId;
  }

  private reportWriteError(action: string, error: unknown): void {
    console.error(`Could not ${action} the task in Firestore.`, error);
    this.error.set('Could not save your task. Check your connection and Firestore rules.');
  }
}
