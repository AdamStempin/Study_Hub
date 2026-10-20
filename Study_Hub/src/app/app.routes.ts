import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page.component';
import { TasksPageComponent } from './features/tasks/pages/tasks-page.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardPageComponent,
  },
  {
    path: 'tasks',
    component: TasksPageComponent,
  },
  {
    path: 'tasks/:id',
    component: TasksPageComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
