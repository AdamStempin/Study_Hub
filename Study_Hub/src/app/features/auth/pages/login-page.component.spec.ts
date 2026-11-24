import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { FirebaseAuthService } from '../../../core/services/firebase-auth.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  it('shows Google sign-in and navigates after successful authentication', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: FirebaseAuthService,
          useValue: { signInWithGoogle },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const googleButton = page.querySelector<HTMLButtonElement>('.google-button');
    expect(googleButton?.textContent).toContain('Continue with Google');

    googleButton?.click();
    await fixture.whenStable();

    expect(signInWithGoogle).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });
});
