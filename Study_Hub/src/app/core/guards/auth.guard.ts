import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { auth } from '../services/firebase';

export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const { auth } = await import('../services/firebase');
  await auth.authStateReady();

  if (auth.currentUser) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const signedOutGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const { auth } = await import('../services/firebase');
  await auth.authStateReady();
  return auth.currentUser ? router.createUrlTree(['/']) : true;
};
