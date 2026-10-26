import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, vi } from 'vitest';
import { PomodoroPageComponent } from './pomodoro-page.component';

describe('PomodoroPageComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PomodoroPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the timer controls, settings, study overview, and history', async () => {
    const fixture = TestBed.createComponent(PomodoroPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Make time for focus');
    expect(page.querySelector('.nav-link[aria-label="Timer"]')?.getAttribute('href')).toBe('/timer');
    expect(Array.from(page.querySelectorAll('.nav-link span')).map((item) => item.textContent?.trim()))
      .toEqual(['Dashboard', 'Subjects', 'Tasks', 'Calendar', 'Timer', 'Statistics', 'Settings']);
    expect(page.querySelector('.profile-copy strong')?.textContent).toContain('Adam Stempin');
    expect(page.querySelector('button[aria-label="Start timer"]')).toBeTruthy();
    expect(page.querySelector('input[name="workMinutes"]')).toBeTruthy();
    expect(page.querySelector('[aria-label="Study time for each day this week"]')).toBeTruthy();
    expect(page.querySelector('.subject-empty')?.textContent).toContain('Complete a focus session');
    expect(page.querySelector('.recent-empty')?.textContent).toContain('Your sessions will show up here');
  });

  it('starts and pauses the shared Pomodoro timer', async () => {
    const fixture = TestBed.createComponent(PomodoroPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;

    page.querySelector<HTMLButtonElement>('button[aria-label="Start timer"]')?.click();
    fixture.detectChanges();
    expect(page.querySelector('button[aria-label="Pause timer"]')).toBeTruthy();

    page.querySelector<HTMLButtonElement>('button[aria-label="Pause timer"]')?.click();
    fixture.detectChanges();
    expect(page.querySelector('button[aria-label="Continue timer"]')).toBeTruthy();
  });

  it('groups completed focus time by subject', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T08:00:00'));

    const fixture = TestBed.createComponent(PomodoroPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const { timer } = fixture.componentInstance;
    timer.updateSettings({ ...timer.state().settings, workMinutes: 1 });
    timer.setSubject('Mathematics');
    timer.start();
    await vi.advanceTimersByTimeAsync(60_000);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const subjectRow = page.querySelector('.subject-row');
    expect(subjectRow?.textContent).toContain('Mathematics');
    expect(subjectRow?.textContent).toContain('1 min');
    expect(subjectRow?.textContent).toContain('1 focus session');
  });
});
