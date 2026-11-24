import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskService } from './task.service';
import { provideTaskServiceTestDoubles } from './task-service-test-utils';

describe('TaskService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('tracks cloud tasks, orders deadlines, and updates task summaries', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 8));
    TestBed.configureTestingModule({
      providers: [TaskService, ...provideTaskServiceTestDoubles()],
    });
    const tasks = TestBed.inject(TaskService);
    TestBed.flushEffects();

    expect(await tasks.addTask('Mathematics', 'Review algebra', '2026-10-21T10:00')).toBe(true);
    expect(await tasks.addTask('mathematics', 'Finish exercises', '2026-10-20T11:00')).toBe(true);
    expect(await tasks.addTask('Physics', 'Review motion', '2026-10-20T07:00')).toBe(false);

    expect(tasks.activeSubjectCount()).toBe(1);
    expect(tasks.tasksDueToday()).toBe(1);
    expect(tasks.upcomingDeadlineCount()).toBe(2);
    expect(tasks.upcomingTasks().map((task) => task.description)).toEqual([
      'Finish exercises',
      'Review algebra',
    ]);

    expect(await tasks.toggleComplete(tasks.upcomingTasks()[0].id)).toBe(true);
    expect(tasks.tasksDueToday()).toBe(0);
    expect(tasks.upcomingDeadlineCount()).toBe(1);
    expect(tasks.completedThisWeek()).toBe(1);
  });

  it('updates and deletes a task by its Firestore identifier', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 8));
    TestBed.configureTestingModule({
      providers: [TaskService, ...provideTaskServiceTestDoubles()],
    });
    const tasks = TestBed.inject(TaskService);
    TestBed.flushEffects();
    await tasks.addTask('Chemistry', 'Review atoms', '2026-10-21T10:00');
    const taskId = tasks.tasks()[0].id;

    expect(await tasks.updateTask(taskId, 'Chemistry II', 'Study reactions', '2026-10-22T12:00')).toBe(true);
    expect(tasks.tasks()[0]).toMatchObject({
      subject: 'Chemistry II',
      description: 'Study reactions',
      dueAt: new Date('2026-10-22T12:00').getTime(),
    });
    expect(await tasks.updateTask(taskId, '', 'Study reactions', '2026-10-22T12:00')).toBe(false);

    expect(await tasks.deleteTask(taskId)).toBe(true);
    expect(tasks.tasks()).toEqual([]);
  });
});
