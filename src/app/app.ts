import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterModule, AsyncPipe],
  template: `
    <header class="app-header">
      <div class="header-left">
        <!-- User Role Badge with Person Icon -->
        <ng-container *ngIf="authService.currentUser$ | async">
          <div class="user-role-indicator" [class.admin-indicator]="authService.isAdmin$ | async">
            <div class="role-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </div>
            <span class="role-text">{{
              (authService.isAdmin$ | async) ? 'ADMIN' : 'CITIZEN'
            }}</span>
          </div>
        </ng-container>
        <div class="logo-area">
          <div class="logo-badge">BCCD</div>
        </div>
        <h1>MOUNTAIN<br />SENTINEL</h1>
      </div>

      <!-- Hamburger Menu Button -->
      <button
        class="hamburger-btn"
        (click)="toggleMenu()"
        [class.active]="menuOpen"
        aria-label="Toggle menu"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <nav class="header-nav" [class.open]="menuOpen">
        <a
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          (click)="closeMenu()"
          >Home</a
        >

        <ng-container *ngIf="authService.currentUser$ | async as user; else loggedOut">
          <!-- Submit Safety Alert - Only for Citizens -->
          <a
            *ngIf="!(authService.isAdmin$ | async)"
            routerLink="/report"
            routerLinkActive="active"
            class="report-link"
            (click)="handleReportClick($event)"
            >Submit Safety Alert</a
          >

          <!-- Admin Section -->
          <ng-container *ngIf="authService.isAdmin$ | async">
            <a
              routerLink="/admin-dashboard"
              routerLinkActive="active"
              class="admin-link"
              (click)="closeMenu()"
              >Admin Dashboard</a
            >
            <a
              routerLink="/admin-report"
              routerLinkActive="active"
              class="admin-report-link"
              (click)="closeMenu()"
              >Issue Alert</a
            >
          </ng-container>

          <!-- Admin SOS Notifications -->
          <a
            *ngIf="authService.isAdmin$ | async"
            routerLink="/notification"
            routerLinkActive="active"
            class="notification-link sos-emergency-link"
            (click)="closeMenu()"
          >
            Emergency SOS
            <span *ngIf="sosCount$ | async as count" class="sos-badge" [class.hidden]="count === 0">
              {{ count }}
            </span>
          </a>

          <!-- User Safety Alerts -->
          <a
            *ngIf="!(authService.isAdmin$ | async)"
            routerLink="/notification"
            routerLinkActive="active"
            class="notification-link"
            (click)="closeMenu()"
          >
            Safety Alerts
            <span
              *ngIf="unreadCount$ | async as count"
              class="unread-badge"
              [class.hidden]="count === 0"
            >
              {{ count }}
            </span>
          </a>

          <!-- Logout Button -->
          <button class="logout-btn" (click)="logout(); closeMenu()">Logout</button>
        </ng-container>

        <ng-template #loggedOut>
          <!-- Submit Safety Alert - Shown for non-logged users -->
          <a
            routerLink="/report"
            routerLinkActive="active"
            class="report-link"
            (click)="handleReportClick($event)"
            >Submit Safety Alert</a
          >
          <a routerLink="/login" routerLinkActive="active" class="login-link" (click)="closeMenu()"
            >Login / Sign-up</a
          >
        </ng-template>
      </nav>

      <!-- Mobile Menu Overlay -->
      <div class="menu-overlay" [class.open]="menuOpen" (click)="closeMenu()"></div>
    </header>

    <main class="app-main">
      <router-outlet></router-outlet>
    </main>

    <!-- Authentication Prompt Modal -->
    @if (showAuthPrompt) {
      <div class="modal-overlay" (click)="closeAuthPrompt()">
        <div class="auth-prompt-modal" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="closeAuthPrompt()" aria-label="Close">&times;</button>
          <div class="modal-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Authentication Required</h2>
          <p class="modal-message">
            You need to create an account or sign in before you can submit a safety alert.
          </p>
          <p class="modal-submessage">
            Creating an account helps us verify reports and keep the community safe.
          </p>
          <div class="modal-actions">
            <button class="modal-btn primary-btn" (click)="navigateToLogin()">
              Sign In / Sign Up
            </button>
            <button class="modal-btn secondary-btn" (click)="closeAuthPrompt()">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'Mountain Sentinel';
  protected authService = inject(AuthService);
  protected notificationService = inject(NotificationService);
  private router = inject(Router);
  unreadCount$: Observable<number>;
  sosCount$: Observable<number>;
  showAuthPrompt = false;
  menuOpen = false;

  constructor() {
    this.unreadCount$ = this.notificationService.getUnreadCount();
    this.sosCount$ = this.notificationService.getSOSCount();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  handleReportClick(event: Event): void {
    // Check if user is logged in using take(1) for immediate value
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (!user) {
        // User is not logged in, prevent navigation and show modal
        event.preventDefault();
        this.showAuthPrompt = true;
      }
      // If user is logged in, allow normal navigation (do nothing)
    });
  }

  closeAuthPrompt(): void {
    this.showAuthPrompt = false;
  }

  navigateToLogin(): void {
    this.showAuthPrompt = false;
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout();
  }
}
