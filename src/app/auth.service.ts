// src/app/auth.service.ts (CORRECTED)

import { Injectable, inject } from '@angular/core';
import {
  Auth as FirebaseAuth, // 👈 FIX: Alias imported Auth type to FirebaseAuth
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  updateProfile,
  user,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Data } from './data';
import { Observable, of, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
// 👈 FIX: Rename local class to AuthService
export class AuthService {
  // Inject the aliased type
  private auth = inject(FirebaseAuth);
  private router = inject(Router);
  private data = inject(Data);

  // Observable to track the current Firebase user state (null if logged out)
  currentUser$ = user(this.auth);

  // Observable that emits true when the user has an `admin` custom claim
  isAdmin$ = this.currentUser$.pipe(
    switchMap((u: any) => {
      if (!u) return of(false);
      // getIdTokenResult returns a promise
      return from(u.getIdTokenResult()).pipe(map((t: any) => !!t.claims?.admin));
    }),
  );

  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Login successful for:', userCredential.user.email);

      // redirect based on admin claim
      try {
        const u: any = this.auth.currentUser;
        if (u) {
          const tokenResult = await u.getIdTokenResult();
          const isAdmin = !!tokenResult.claims?.admin;
          console.log('User admin status:', isAdmin);
          this.router.navigate([isAdmin ? '/admin-dashboard' : '/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } catch (e) {
        console.error('Token check error:', e);
        // fallback to dashboard
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      console.error('Login failed:', error.code, error.message);

      // Provide more specific error messages
      let errorMsg = 'Login failed: ';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMsg += 'No account found with this email. Please sign up first.';
          break;
        case 'auth/wrong-password':
          errorMsg += 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMsg += 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMsg += 'This account has been disabled.';
          break;
        case 'auth/invalid-credential':
          errorMsg += 'Invalid credentials. Please check your email and password.';
          break;
        default:
          errorMsg += error.message || 'An error occurred. Please try again.';
      }

      throw new Error(errorMsg);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }

  async sendVerificationEmail(): Promise<void> {
    // If there's a current user, send a verification email. Return gracefully otherwise.
    const current = this.auth.currentUser as any;
    if (!current) throw new Error('No authenticated user to send verification to');

    try {
      await sendEmailVerification(current);
    } catch (err) {
      console.error('Failed to send verification email:', err);
      throw err;
    }
  }

  async register(email: string, password: string, displayName?: string): Promise<void> {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // create a profile doc in Firestore, the Data service will make the first registered user an admin
      try {
        if (cred.user) {
          await this.data.createUserProfile(cred.user.uid, {
            email: cred.user.email ?? '',
            displayName: cred.user.displayName ?? '',
            phoneNumber: (cred.user as any).phoneNumber ?? '',
          });
        }
      } catch (err) {
        console.warn('Failed to create user profile automatically:', err);
      }

      // the user is signed in after register; navigate to home
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Registration failed:', err);
      throw new Error(err?.message || 'Registration failed');
    }
  }

  isLoggedIn(): Observable<boolean> {
    return new Observable((observer) => {
      this.currentUser$.subscribe((user) => {
        observer.next(!!user);
      });
    });
  }
}
