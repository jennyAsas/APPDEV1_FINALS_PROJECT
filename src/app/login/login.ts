import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [CommonModule, FormsModule],
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  tab: 'admin' | 'user' | 'signup' = 'user';

  // Admin form fields
  adminEmail = '';
  adminPassword = '';
  adminErrorMessage: string | null = null;

  // User form fields
  userEmail = '';
  userPassword = '';
  userErrorMessage: string | null = null;

  // Signup form fields
  email = '';
  password = '';
  displayName = '';
  confirmPassword = '';
  errorMessage: string | null = null;

  isLoading = false;

  ngOnInit(): void {
    // Default to user tab
    this.tab = 'user';
  }

  setTab(tab: 'admin' | 'user' | 'signup') {
    this.tab = tab;
    // Clear errors and fields when switching tabs
    this.adminErrorMessage = null;
    this.userErrorMessage = null;
    this.errorMessage = null;
  }

  async onSubmitAdmin(): Promise<void> {
    this.adminErrorMessage = null;
    this.isLoading = true;
    try {
      await this.authService.login(this.adminEmail, this.adminPassword);
    } catch (error: any) {
      this.adminErrorMessage = error.message || 'Admin login failed.';
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmitUser(): Promise<void> {
    this.userErrorMessage = null;
    this.isLoading = true;
    try {
      await this.authService.login(this.userEmail, this.userPassword);
    } catch (error: any) {
      this.userErrorMessage = error.message || 'User login failed.';
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = null;
    this.isLoading = true;
    try {
      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Passwords do not match.';
        this.isLoading = false;
        return;
      }
      await this.authService.register(this.email, this.password, this.displayName || undefined);
    } catch (error: any) {
      this.errorMessage = error.message || 'Signup failed.';
    } finally {
      this.isLoading = false;
    }
  }
}
