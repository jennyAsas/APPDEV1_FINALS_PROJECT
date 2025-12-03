// src/app/sos-button/sos-button.ts

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-sos-button',
  template: `
    <button class="sos-btn" (click)="triggerSos()" [disabled]="isReporting">
      🚨 {{ isReporting ? 'Sending...' : 'EMERGENCY SOS' }} 🚨
    </button>
  `,
  styleUrl: './sos-button.css',
  imports: [CommonModule],
})
export class SosButton {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  public isReporting = false;

  triggerSos(): void {
    if (this.isReporting) return;
    this.isReporting = true;

    // Check if user is logged in
    firstValueFrom(this.auth.currentUser$).then((user) => {
      if (!user) {
        alert('You must be logged in to send an SOS. Redirecting to login...');
        this.isReporting = false;
        this.router.navigate(['/login']);
        return;
      }

      // Add SOS notification
      this.notificationService.addSosNotification();

      // Navigate to notification with SOS flag
      this.router.navigate(['/notification'], { queryParams: { sos: 'true' } }).then(() => {
        this.isReporting = false;
      });
    });
  }
}
