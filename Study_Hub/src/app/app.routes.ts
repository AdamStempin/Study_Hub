import { Routes } from '@angular/router';
import { authGuard, signedOutGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login-page.component')
      .then((module) => module.LoginPageComponent),
    canActivate: [signedOutGuard],
  },
  {
    path: '',
    loadComponent: () => import('./features/dashboard/pages/dashboard-page.component')
      .then((module) => module.DashboardPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/pages/tasks-page.component')
      .then((module) => module.TasksPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tasks/:id',
    loadComponent: () => import('./features/tasks/pages/tasks-page.component')
      .then((module) => module.TasksPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'timer',
    loadComponent: () => import('./features/pomodoro/pages/pomodoro-page.component')
      .then((module) => module.PomodoroPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
