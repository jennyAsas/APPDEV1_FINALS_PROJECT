import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { ReportService, Report } from '../report.service';
import { NotificationService } from '../notification.service';
import { Observable, Subscription, interval } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [CommonModule, RouterModule],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private reportService = inject(ReportService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private sosSubscription?: Subscription;

  currentUser$ = this.authService.currentUser$;
  isAdmin$ = this.authService.isAdmin$;

  // Citizen reports (non-admin)
  citizenReports$: Observable<Report[]> = this.reportService
    .getAllReports()
    .pipe(
      map((reports) =>
        reports.filter(
          (r) => r.status === 'approved' && !r.isAdminReport && r.reporterId !== 'ADMIN',
        ),
      ),
    );

  // Admin alerts/announcements
  adminAlerts$: Observable<Report[]> = this.reportService
    .getAllReports()
    .pipe(
      map((reports) =>
        reports.filter(
          (r) => r.status === 'approved' && (r.isAdminReport || r.reporterId === 'ADMIN'),
        ),
      ),
    );

  // Legacy - keep for compatibility
  approvedReports$: Observable<Report[]> = this.reportService
    .getAllReports()
    .pipe(map((reports) => reports.filter((r) => r.status === 'approved')));

  // SOS Animation state
  sosActive = false;
  sosSuccess = false;
  sosProgress = 0;
  sosCountdown = 5;
  private sosDuration = 5; // 5 seconds animation
  userLocation: { lat: number; lng: number } | null = null;
  locationError: string | null = null;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.sosSubscription) {
      this.sosSubscription.unsubscribe();
    }
  }

  navigateToReport(): void {
    this.router.navigate(['/report']);
  }

  viewFullMap(): void {
    this.router.navigate(['/map']);
  }

  triggerSOS(): void {
    // Check if user is logged in first
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (!user) {
        alert('Please log in to send an emergency SOS alert.');
        this.router.navigate(['/login']);
        return;
      }

      // Start SOS animation
      this.sosActive = true;
      this.sosSuccess = false;
      this.sosProgress = 0;
      this.sosCountdown = this.sosDuration;
      this.userLocation = null;
      this.locationError = null;

      // Start getting location immediately (runs in parallel with animation)
      this.getLocationAsync();

      // Progress animation over 5 seconds
      const totalSteps = 50; // 50 steps = 100ms each = 5 seconds
      let currentStep = 0;

      this.sosSubscription = interval(100).subscribe(() => {
        currentStep++;
        this.sosProgress = (currentStep / totalSteps) * 100;

        // Update countdown every second
        this.sosCountdown = Math.ceil(this.sosDuration - currentStep / 10);
        if (this.sosCountdown < 0) this.sosCountdown = 0;

        if (currentStep >= totalSteps) {
          this.sosSubscription?.unsubscribe();
          this.completeSOS(user);
        }
      });
    });
  }

  private getLocationAsync(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('Location obtained:', this.userLocation);
        },
        (error) => {
          console.warn('Location error:', error.message);
          this.locationError = error.message;
          // Try with lower accuracy as fallback
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              console.log('Location obtained (low accuracy):', this.userLocation);
            },
            (err) => {
              console.error('Location failed completely:', err.message);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    }
  }

  private completeSOS(user: any): void {
    // Use the location that was obtained during animation, or try one more time
    if (this.userLocation) {
      this.sendSOSToAdmin(user, this.userLocation);
    } else if (navigator.geolocation) {
      // Final attempt to get location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.sendSOSToAdmin(user, location);
        },
        () => {
          // Location not available, send without it
          console.warn('Could not obtain location for SOS');
          this.sendSOSToAdmin(user);
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 },
      );
    } else {
      this.sendSOSToAdmin(user);
    }
  }

  private sendSOSToAdmin(user: any, location?: { lat: number; lng: number }): void {
    // Send emergency SOS alert to admin
    this.reportService.sendEmergencySOS(
      user.email || 'emergency-user@sos.alert',
      user.displayName || 'Unknown User',
      location,
    );

    // Show success state
    this.sosSuccess = true;

    // Play success sound/vibration if available
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  closeSosOverlay(): void {
    this.sosActive = false;
    this.sosSuccess = false;
    this.sosProgress = 0;
    this.sosCountdown = this.sosDuration;

    // Navigate to notifications to see the SOS confirmation
    this.router.navigate(['/notification'], { queryParams: { sos: 'sent' } });
  }

  viewReportDetail(reportId: string): void {
    this.router.navigate(['/report-detail', reportId]);
  }
}
