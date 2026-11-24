import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FirebaseAuthService } from '../../core/services/firebase-auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly auth = inject(FirebaseAuthService);
  readonly errorMessage = signal('');
  private readonly router = inject(Router);

  get userInitials(): string {
    const user = this.auth.user();
    const name = user?.displayName || user?.email || '';
    const parts = name.split(/[\s@._-]+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';
  }

  async signOut(): Promise<void> {
    this.errorMessage.set('');
    try {
      await this.auth.signOut();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Could not sign out from Firebase Authentication.', error);
      this.errorMessage.set('Could not sign out. Please try again.');
    }
  }}
