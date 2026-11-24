import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly destroyRef = inject(DestroyRef);
  readonly user = signal<User | null>(auth.currentUser);

  constructor() {
    const unsubscribe = onAuthStateChanged(auth, (user) => this.user.set(user));
    this.destroyRef.onDestroy(unsubscribe);
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async createAccount(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }
}
