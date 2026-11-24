import { signal } from '@angular/core';
import type { Provider } from '@angular/core';
import type { Unsubscribe } from 'firebase/firestore';
import { FirebaseAuthService } from '../../../core/services/firebase-auth.service';
import type { StudyTask } from '../models/study-task.model';
import { FirestoreTaskRepository } from './firestore-task.repository';

type NewStudyTask = Omit<StudyTask, 'id'>;

export class FakeFirestoreTaskRepository {
  private tasks: StudyTask[] = [];
  private nextId = 0;
  private listener: ((tasks: StudyTask[]) => void) | null = null;

  watch(
    _userId: string,
    onTasks: (tasks: StudyTask[]) => void,
    _onError: (error: Error) => void,
  ): Unsubscribe {
    this.listener = onTasks;
    onTasks([...this.tasks]);
    return () => {
      if (this.listener === onTasks) {
        this.listener = null;
      }
    };
  }

  async create(_userId: string, task: NewStudyTask): Promise<string> {
    const id = `task-${++this.nextId}`;
    this.tasks = [...this.tasks, { ...task, id }];
    this.emit();
    return id;
  }

  async update(
    _userId: string,
    taskId: string,
    changes: Partial<NewStudyTask>,
  ): Promise<void> {
    this.tasks = this.tasks.map((task) => task.id === taskId ? { ...task, ...changes } : task);
    this.emit();
  }

  async delete(_userId: string, taskId: string): Promise<void> {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.emit();
  }

  private emit(): void {
    this.listener?.([...this.tasks]);
  }
}

export function provideTaskServiceTestDoubles(): Provider[] {
  const user = signal({
    uid: 'test-user',
    displayName: 'Adam Stempin',
    email: 'adam@example.com',
  });

  return [
    { provide: FirebaseAuthService, useValue: { user, signOut: async () => {} } },
    { provide: FirestoreTaskRepository, useClass: FakeFirestoreTaskRepository },
  ];
}
