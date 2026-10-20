import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render the English dashboard greeting', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hi, Adam!');
  });

  it('should render the configurable Timer and its controls', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#pomodoro h2')?.textContent).toBe('Timer');
    expect(compiled.querySelector('#pomodoro input[placeholder="e.g. Mathematics"]')).toBeTruthy();
    expect(compiled.querySelector('#pomodoro button[aria-label="Start timer"]')).toBeTruthy();
    expect(compiled.querySelector('#pomodoro button[aria-label="Open timer settings"]')).toBeTruthy();
  });

  it('should flip to the timer settings with all available settings', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('#pomodoro button[aria-label="Open timer settings"]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.timer-card')?.classList.contains('settings-open')).toBe(true);
    expect(compiled.querySelector('.timer-back h2')?.textContent).toBe('Timer settings');
    expect(compiled.querySelector('.timer-back input[name="workMinutes"]')).toBeTruthy();
    expect(compiled.querySelector('.timer-back input[name="shortBreakMinutes"]')).toBeTruthy();
    expect(compiled.querySelector('.timer-back input[name="longBreakMinutes"]')).toBeTruthy();
    expect(compiled.querySelector('.timer-back input[name="intervalsBeforeLongBreak"]')).toBeTruthy();
    expect(compiled.querySelector('.timer-back input[name="soundEnabled"]')).toBeTruthy();
    expect(compiled.querySelector('.timer-back button[type="submit"]')?.textContent).toContain('Save settings');

    compiled.querySelector<HTMLButtonElement>('.timer-back button[aria-label="Return to timer"]')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.timer-card')?.classList.contains('settings-open')).toBe(false);
  });

  it('adds a task and updates dashboard deadlines and summary cards', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.welcome .primary-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('[role="dialog"] h2')?.textContent).toContain('Add a study task');

    const dueDate = new Date(Date.now() + 60 * 60 * 1000);
    const localDueDate = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
    fixture.componentInstance.newTask = {
      subject: 'Biology',
      description: 'Review cell structure',
      dueDateTime: localDueDate,
    };
    compiled.querySelector<HTMLButtonElement>('.task-form button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
    expect(compiled.querySelector('.deadline-copy strong')?.textContent).toContain('Biology');
    expect(compiled.querySelector('.deadline-copy small')?.textContent).toContain('Review cell structure');
    expect(Array.from(compiled.querySelectorAll('.stat-card strong')).map((item) => item.textContent?.trim()))
      .toEqual(['1', '1', '1', '0']);

    compiled.querySelector<HTMLButtonElement>('.task-complete-button')?.click();
    fixture.detectChanges();
    expect(Array.from(compiled.querySelectorAll('.stat-card strong')).map((item) => item.textContent?.trim()))
      .toEqual(['0', '0', '0', '1']);
  });
});
