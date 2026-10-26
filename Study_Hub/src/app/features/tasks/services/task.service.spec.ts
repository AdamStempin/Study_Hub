import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskService } from './task.service';

describe('TaskService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks tasks in memory, orders deadlines, and updates task summaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 8));
    const tasks = new TaskService();

    expect(tasks.addTask('Mathematics', 'Review algebra', '2026-10-21T10:00')).toBe(true);
    expect(tasks.addTask('mathematics', 'Finish exercises', '2026-10-20T11:00')).toBe(true);
    expect(tasks.addTask('Physics', 'Review motion', '2026-10-20T07:00')).toBe(false);

    expect(tasks.activeSubjectCount()).toBe(1);
    expect(tasks.tasksDueToday()).toBe(1);
    expect(tasks.upcomingDeadlineCount()).toBe(2);
    expect(tasks.upcomingTasks().map((task) => task.description)).toEqual([
      'Finish exercises',
      'Review algebra',
    ]);

    tasks.toggleComplete(tasks.upcomingTasks()[0].id);
    expect(tasks.tasksDueToday()).toBe(0);
    expect(tasks.upcomingDeadlineCount()).toBe(1);
    expect(tasks.completedThisWeek()).toBe(1);

    const freshTasks = new TaskService();
    expect(freshTasks.tasks()).toEqual([]);
    expect(freshTasks.activeSubjectCount()).toBe(0);
  });

  it('updates and deletes a task by its identifier', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 8));
    const tasks = new TaskService();
    tasks.addTask('Chemistry', 'Review atoms', '2026-10-21T10:00');
    const taskId = tasks.tasks()[0].id;

    expect(tasks.updateTask(taskId, 'Chemistry II', 'Study reactions', '2026-10-22T12:00')).toBe(true);
    expect(tasks.tasks()[0]).toMatchObject({
      subject: 'Chemistry II',
      description: 'Study reactions',
      dueAt: new Date('2026-10-22T12:00').getTime(),
    });
    expect(tasks.updateTask(taskId, '', 'Study reactions', '2026-10-22T12:00')).toBe(false);

    tasks.deleteTask(taskId);
    expect(tasks.tasks()).toEqual([]);
  });
});
