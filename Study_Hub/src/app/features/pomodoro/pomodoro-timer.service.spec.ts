import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PomodoroTimerService } from './pomodoro-timer.service';

describe('PomodoroTimerService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T08:00:00'));
    TestBed.configureTestingModule({
      providers: [PomodoroTimerService],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  function configureShortCycle(timer: PomodoroTimerService): void {
    timer.updateSettings({
      ...timer.state().settings,
      workMinutes: 1,
      shortBreakMinutes: 1,
      longBreakMinutes: 3,
      intervalsBeforeLongBreak: 2,
    });
  }

  it('records completed focus intervals only and follows the long-break cycle', async () => {
    const timer = TestBed.inject(PomodoroTimerService);
    configureShortCycle(timer);
    timer.setSubject('Mathematics');
    timer.setTask('Linear algebra');

    timer.start();
    expect(timer.state().status).toBe('running');
    await vi.advanceTimersByTimeAsync(60_000);

    expect(timer.state().phase).toBe('shortBreak');
    expect(timer.state().status).toBe('idle');
    expect(timer.state().completedWorkIntervals).toBe(1);
    expect(timer.state().sessions).toEqual([
      expect.objectContaining({
        durationSeconds: 60,
        subject: 'Mathematics',
        task: 'Linear algebra',
      }),
    ]);

    timer.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(timer.state().phase).toBe('work');

    timer.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(timer.state().phase).toBe('longBreak');
    expect(timer.state().completedWorkIntervals).toBe(2);
    expect(timer.weekStudySeconds()).toBe(120);
    expect(timer.weekCompletedIntervals()).toBe(2);
    expect(timer.weeklyStudyDays().find((day) => day.isToday)?.studySeconds).toBe(120);
  });

  it('does not record focus time for an interval that is skipped or reset', async () => {
    const timer = TestBed.inject(PomodoroTimerService);
    configureShortCycle(timer);

    timer.start();
    await vi.advanceTimersByTimeAsync(20_000);
    timer.skip();

    expect(timer.state().phase).toBe('shortBreak');
    expect(timer.state().completedWorkIntervals).toBe(0);
    expect(timer.state().sessions).toHaveLength(0);
    expect(timer.todayStudySeconds()).toBe(0);

    timer.reset();
    expect(timer.state().phase).toBe('shortBreak');
    expect(timer.remainingSeconds()).toBe(60);
    expect(timer.state().sessions).toHaveLength(0);
  });

  it('pauses and resumes an active interval using its deadline', async () => {
    const timer = TestBed.inject(PomodoroTimerService);
    configureShortCycle(timer);

    timer.start();
    await vi.advanceTimersByTimeAsync(20_000);
    timer.pause();
    expect(timer.remainingSeconds()).toBe(40);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(timer.remainingSeconds()).toBe(40);
    timer.start();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(timer.remainingSeconds()).toBe(30);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(timer.state().completedWorkIntervals).toBe(1);
    expect(timer.state().phase).toBe('shortBreak');
    expect(timer.todayStudySeconds()).toBe(60);
  });

  it('starts with fresh defaults and does not read or write browser storage', () => {
    const savedState = {
      phase: 'work',
      status: 'paused',
      remainingSeconds: 30,
      completedWorkIntervals: 3,
    };
    localStorage.setItem('study-hub.pomodoro.v1', JSON.stringify(savedState));

    const timer = TestBed.inject(PomodoroTimerService);

    expect(timer.state().status).toBe('idle');
    expect(timer.state().remainingSeconds).toBe(25 * 60);
    expect(timer.state().completedWorkIntervals).toBe(0);
    timer.updateSettings({ ...timer.state().settings, workMinutes: 20 });
    expect(localStorage.getItem('study-hub.pomodoro.v1')).toBe(JSON.stringify(savedState));
  });
});
