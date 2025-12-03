import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NotificationService, Notification } from '../notification.service';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-notification',
  imports: [CommonModule, DatePipe, UpperCasePipe],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
})
export class NotificationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  showSosAlert = false;
  sosMessage = '';
  selectedSOS: Notification | null = null;
  notifications$: Observable<Notification[]> = this.notificationService.getNotifications();
  isAdmin$ = this.authService.isAdmin$;

  ngOnInit(): void {
    // Check if this is an SOS notification from query params
    const sosStatus = this.route.snapshot.queryParamMap.get('sos');
    if (sosStatus === 'sent') {
      this.triggerSosAlert();
    }
  }

  triggerSosAlert(): void {
    this.sosMessage =
      'EMERGENCY SOS SENT - Police/Admin have been notified and will respond immediately. Stay safe!';
    this.showSosAlert = true;

    // Auto-hide alert after 10 seconds
    setTimeout(() => {
      this.showSosAlert = false;
    }, 10000);
  }

  closeAlert(): void {
    this.showSosAlert = false;
  }

  onNotificationClick(notification: Notification): void {
    // If it's an SOS notification with details and user is admin, show detail modal
    if (notification.sosDetails) {
      this.authService.isAdmin$.pipe(take(1)).subscribe((isAdmin) => {
        if (isAdmin) {
          this.selectedSOS = notification;
        }
      });
    }
  }

  closeSOSDetail(): void {
    this.selectedSOS = null;
  }

  respondToSOS(notificationId: string): void {
    if (this.selectedSOS && this.selectedSOS.sosDetails) {
      // Mark SOS as responded in the service
      this.notificationService.markSOSAsResponded(notificationId);

      // Notify the user who sent the SOS
      this.notificationService.notifySOSResponse(
        this.selectedSOS.sosDetails.userName,
        this.selectedSOS.sosDetails.userEmail,
        'responded',
      );

      // Update the selected SOS to reflect the change
      this.selectedSOS = {
        ...this.selectedSOS,
        sosDetails: { ...this.selectedSOS.sosDetails, status: 'responded' },
      };
    }
  }

  resolveSOS(notificationId: string): void {
    if (this.selectedSOS && this.selectedSOS.sosDetails) {
      // Mark SOS as resolved in the service
      this.notificationService.markSOSAsResolved(notificationId);

      // Notify the user who sent the SOS
      this.notificationService.notifySOSResponse(
        this.selectedSOS.sosDetails.userName,
        this.selectedSOS.sosDetails.userEmail,
        'resolved',
      );

      // Update the selected SOS to reflect the change
      this.selectedSOS = {
        ...this.selectedSOS,
        sosDetails: { ...this.selectedSOS.sosDetails, status: 'resolved' },
      };
    }
  }

  // Quick respond directly from the notification list
  quickRespondToSOS(notification: Notification): void {
    if (notification.sosDetails) {
      // Mark SOS as responded
      this.notificationService.markSOSAsResponded(notification.id);

      // Notify the user who sent the SOS
      this.notificationService.notifySOSResponse(
        notification.sosDetails.userName,
        notification.sosDetails.userEmail,
        'responded',
      );
    }
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId);
    if (this.selectedSOS && this.selectedSOS.id === notificationId) {
      this.selectedSOS = null;
    }
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  clearAll(): void {
    if (confirm('Clear all notifications?')) {
      this.notificationService.clearAll();
      this.selectedSOS = null;
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'sos':
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      case 'alert':
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      case 'action':
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      default:
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
  }

  getNotificationClass(notification: Notification): { [key: string]: boolean } {
    return {
      [`notification-${notification.type}`]: true,
      unread: !notification.read,
    };
  }
}
