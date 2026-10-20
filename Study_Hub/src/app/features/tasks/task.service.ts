import { computed, Injectable, signal } from '@angular/core';

export interface StudyTask {
  id: number;
  subject: string;
  description: string;
  dueAt: number;
  completedAt: number | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly taskSignal = signal<StudyTask[]>([]);
  private nextId = 1;

  readonly tasks = this.taskSignal.asReadonly();
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

  addTask(subject: string, description: string, dueDateTime: string): boolean {
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();
    const dueAt = new Date(dueDateTime).getTime();

    if (!cleanSubject || !cleanDescription || !Number.isFinite(dueAt) || dueAt < Date.now()) {
      return false;
    }

    this.taskSignal.update((tasks) => [
      ...tasks,
      {
        id: this.nextId++,
        subject: cleanSubject,
        description: cleanDescription,
        dueAt,
        completedAt: null,
      },
    ]);
    return true;
  }

  toggleComplete(id: number): void {
    const completedAt = Date.now();
    this.taskSignal.update((tasks) => tasks.map((task) => {
      if (task.id !== id) {
        return task;
      }

      return {
        ...task,
        completedAt: task.completedAt === null ? completedAt : null,
      };
    }));
  }

  updateTask(id: number, subject: string, description: string, dueDateTime: string): boolean {
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();
    const dueAt = new Date(dueDateTime).getTime();

    if (!cleanSubject || !cleanDescription || !Number.isFinite(dueAt)) {
      return false;
    }

    this.taskSignal.update((tasks) => tasks.map((task) => (
      task.id === id ? { ...task, subject: cleanSubject, description: cleanDescription, dueAt } : task
    )));
    return true;
  }

  deleteTask(id: number): void {
    this.taskSignal.update((tasks) => tasks.filter((task) => task.id !== id));
  }
}
