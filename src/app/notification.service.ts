import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'sos' | 'alert' | 'info' | 'action';
  createdAt: string;
  read: boolean;
  // SOS details for admin tracking
  sosDetails?: {
    userName: string;
    userEmail: string;
    location?: { lat: number; lng: number };
    timestamp: string;
    status: 'pending' | 'responded' | 'resolved';
  };
  // Report action details
  reportDetails?: {
    reportId: string;
    action: 'approved' | 'rejected';
    adminNote?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly STORAGE_KEY = 'mountain_sentinel_notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>(
    this.loadNotificationsFromStorage(),
  );

  constructor() {}

  /**
   * Load notifications from localStorage
   */
  private loadNotificationsFromStorage(): Notification[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
      return [];
    }
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotificationsToStorage(notifications: Notification[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  /**
   * Add a new SOS notification (for users)
   */
  addSosNotification(): void {
    const newNotification: Notification = {
      id: this.generateId(),
      message:
        'Emergency SOS sent! Police have been notified and are on their way. Stay calm and safe.',
      type: 'sos',
      createdAt: new Date().toISOString(),
      read: false,
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Add emergency SOS alert for admins
   */
  addEmergencySOSAlert(
    userName: string,
    userEmail: string,
    location?: { lat: number; lng: number },
  ): void {
    const locationText = location
      ? ` Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      : '';

    const newNotification: Notification = {
      id: this.generateId(),
      message: `EMERGENCY SOS from ${userName} (${userEmail}).${locationText} Immediate assistance required!`,
      type: 'sos',
      createdAt: new Date().toISOString(),
      read: false,
      sosDetails: {
        userName,
        userEmail,
        location,
        timestamp: new Date().toISOString(),
        status: 'pending',
      },
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Mark SOS as responded (for admin)
   */
  markSOSAsResponded(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map((n) => {
      if (n.id === notificationId && n.sosDetails) {
        return {
          ...n,
          read: true,
          sosDetails: { ...n.sosDetails, status: 'responded' as const },
        };
      }
      return n;
    });
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Mark SOS as resolved (for admin)
   */
  markSOSAsResolved(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map((n) => {
      if (n.id === notificationId && n.sosDetails) {
        return {
          ...n,
          sosDetails: { ...n.sosDetails, status: 'resolved' as const },
        };
      }
      return n;
    });
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Notify user that their SOS has been responded to
   */
  notifySOSResponse(userName: string, userEmail: string, status: 'responded' | 'resolved'): void {
    const statusMessage =
      status === 'responded'
        ? 'Your emergency SOS has been received! Help is on the way. An admin/police officer is responding to your location. Stay calm and safe.'
        : 'Your emergency SOS has been resolved. The situation has been addressed by authorities. Thank you for using Mountain Sentinel.';

    const newNotification: Notification = {
      id: this.generateId(),
      message: statusMessage,
      type: 'action',
      createdAt: new Date().toISOString(),
      read: false,
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Notify reporter that their report has been acted upon
   */
  notifyReportAction(
    reporterEmail: string,
    reporterName: string,
    reportId: string,
    action: 'approved' | 'rejected',
    description: string,
  ): void {
    const actionText =
      action === 'approved'
        ? 'Your safety report has been reviewed and approved by the admin. Authorities have been notified and appropriate action is being taken.'
        : 'Your safety report has been reviewed. The admin has determined that no further action is required at this time.';

    const newNotification: Notification = {
      id: this.generateId(),
      message: `Report Update: "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}" - ${actionText}`,
      type: 'action',
      createdAt: new Date().toISOString(),
      read: false,
      reportDetails: {
        reportId,
        action,
      },
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Add a general notification
   */
  addNotification(message: string, type: 'alert' | 'info' = 'info'): void {
    const newNotification: Notification = {
      id: this.generateId(),
      message: message,
      type: type,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Get all notifications as observable
   */
  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<number> {
    return new Observable((observer) => {
      this.notificationsSubject.subscribe((notifications) => {
        const unreadCount = notifications.filter((n) => !n.read).length;
        observer.next(unreadCount);
      });
    });
  }

  /**
   * Get unread SOS notification count (for admin)
   */
  getSOSCount(): Observable<number> {
    return new Observable((observer) => {
      this.notificationsSubject.subscribe((notifications) => {
        const sosCount = notifications.filter((n) => n.type === 'sos' && !n.read).length;
        observer.next(sosCount);
      });
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter((n) => n.id !== notificationId);
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotificationsToStorage(updatedNotifications);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
    this.saveNotificationsToStorage([]);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
