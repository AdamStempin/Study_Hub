import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseAuthService } from '../../../core/services/firebase-auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  private readonly auth = inject(FirebaseAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isRegistering = signal(false);
  readonly isSubmitting = signal(false);
  email = '';
  password = '';
  errorMessage = '';

  async submit(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting.set(true);

    try {
      if (this.isRegistering()) {
        await this.auth.createAccount(this.email, this.password);
      } else {
        await this.auth.signIn(this.email, this.password);
      }

      await this.navigateAfterSignIn();
    } catch (error) {
      console.error('Firebase email/password authentication failed.', error);
      this.errorMessage = this.getAuthErrorMessage(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting.set(true);

    try {
      await this.auth.signInWithGoogle();
      await this.navigateAfterSignIn();
    } catch (error) {
      console.error('Firebase Google authentication failed.', error);
      this.errorMessage = this.getAuthErrorMessage(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  toggleMode(): void {
    this.isRegistering.update((registering) => !registering);
    this.errorMessage = '';
  }

  private getAuthErrorMessage(error: unknown): string {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account already exists for this email address. Sign in instead.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'The email or password is incorrect.';
      case 'auth/weak-password':
        return 'Choose a password with at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled in Firebase Authentication.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized in Firebase Authentication settings.';
      case 'auth/popup-blocked':
        return 'The Google sign-in popup was blocked. Allow popups and try again.';
      case 'auth/popup-closed-by-user':
        return 'The Google sign-in window was closed before completing sign-in.';
      case 'auth/cancelled-popup-request':
        return 'A Google sign-in window is already open.';
      default:
        return 'Could not connect to Firebase. Check your connection and Firebase setup.';
    }
  }

  private async navigateAfterSignIn(): Promise<void> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/';
    await this.router.navigateByUrl(destination);
  }
}
