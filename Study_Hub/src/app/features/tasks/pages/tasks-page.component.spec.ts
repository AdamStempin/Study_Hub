import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it } from 'vitest';
import { TasksPageComponent } from './tasks-page.component';
import { TaskService } from '../services/task.service';
import { provideTaskServiceTestDoubles } from '../services/task-service-test-utils';

describe('TasksPageComponent', () => {
  it('shows task details and saves edits from its detail route', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'tasks/:id', component: TasksPageComponent },
          { path: 'tasks', component: TasksPageComponent },
        ]),
        ...provideTaskServiceTestDoubles(),
      ],
    }).compileComponents();

    const tasks = TestBed.inject(TaskService);
    TestBed.flushEffects();
    await tasks.addTask('History', 'Review ancient Rome', '2027-10-22T12:00');
    const taskId = tasks.tasks()[0].id;
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(`/tasks/${taskId}`, TasksPageComponent);

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('History');
    component.taskForm = {
      subject: 'History II',
      description: 'Compare Roman republic and empire',
      dueDateTime: '2027-10-23T14:00',
    };
    await component.saveTask();
    harness.detectChanges();

    expect(tasks.tasks()[0]).toMatchObject({
      subject: 'History II',
      description: 'Compare Roman republic and empire',
      dueAt: new Date('2027-10-23T14:00').getTime(),
    });
    expect(harness.routeNativeElement?.textContent).toContain('Task updated.');
  });
});
