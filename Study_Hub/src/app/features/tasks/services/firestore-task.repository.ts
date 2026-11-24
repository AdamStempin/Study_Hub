import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { StudyTask } from '../models/study-task.model';
import { db } from '../../../core/services/firebase';

type NewStudyTask = Omit<StudyTask, 'id'>;

@Injectable({ providedIn: 'root' })
export class FirestoreTaskRepository {
  watch(
    userId: string,
    onTasks: (tasks: StudyTask[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe {
    const tasks = collection(db, 'users', userId, 'tasks');

    return onSnapshot(query(tasks), (snapshot) => {
      try {
        onTasks(snapshot.docs.map((taskDocument) => {
          const data = taskDocument.data();
          if (
            typeof data['subject'] !== 'string'
            || typeof data['description'] !== 'string'
            || typeof data['dueAt'] !== 'number'
            || (data['completedAt'] !== null && typeof data['completedAt'] !== 'number')
          ) {
            throw new Error(`Invalid task data in Firestore document ${taskDocument.id}.`);
          }

          return {
            id: taskDocument.id,
            subject: data['subject'],
            description: data['description'],
            dueAt: data['dueAt'],
            completedAt: data['completedAt'],
          };
        }));
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Invalid task data returned by Firestore.'));
      }
    }, onError);
  }

  async create(userId: string, task: NewStudyTask): Promise<string> {
    const reference = doc(collection(db, 'users', userId, 'tasks'));
    await setDoc(reference, task);
    return reference.id;
  }

  async update(
    userId: string,
    taskId: string,
    changes: Partial<NewStudyTask>,
  ): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), changes);
  }

  async delete(userId: string, taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  }
}
