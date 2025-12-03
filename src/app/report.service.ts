import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notification.service';

export interface Report {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  description: string;
  street: string;
  barangay: string;
  landmark?: string;
  city?: string;
  imageUrl?: string;
  idImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  priority?: 'high' | 'medium' | 'low';
  location?: {
    lat: number;
    lng: number;
  };
  locationAccuracy?: number;
  timestamp?: string;
  createdAt: string;
  updatedAt: string;
  isAdminReport?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly STORAGE_KEY = 'mountain_sentinel_reports';
  private reportsSubject = new BehaviorSubject<Report[]>(this.loadReportsFromStorage());
  private notificationService = inject(NotificationService);

  constructor() {}

  /**
   * Load reports from localStorage, or initialize with empty array
   */
  private loadReportsFromStorage(): Report[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading reports from storage:', error);
      return [];
    }
  }

  /**
   * Persist reports to localStorage
   */
  private saveReportsToStorage(reports: Report[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving reports to storage:', error);
    }
  }

  /**
   * Submit a new report with status 'pending'
   */
  submitReport(
    payload: Omit<Report, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Observable<Report> {
    const now = new Date().toISOString();
    const newReport: Report = {
      ...payload,
      id: this.generateId(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const currentReports = this.reportsSubject.value;
    const updatedReports = [...currentReports, newReport];
    this.reportsSubject.next(updatedReports);
    this.saveReportsToStorage(updatedReports);

    return this.reportsSubject
      .asObservable()
      .pipe(map((reports) => reports.find((r) => r.id === newReport.id)!));
  }

  /**
   * Get all reports as an observable
   */
  getAllReports(): Observable<Report[]> {
    return this.reportsSubject.asObservable();
  }

  /**
   * Get only pending reports
   */
  getPendingReports(): Observable<Report[]> {
    return this.reportsSubject
      .asObservable()
      .pipe(map((reports) => reports.filter((r) => r.status === 'pending')));
  }

  /**
   * Get only approved reports
   */
  getApprovedReports(): Observable<Report[]> {
    return this.reportsSubject
      .asObservable()
      .pipe(map((reports) => reports.filter((r) => r.status === 'approved')));
  }

  /**
   * Approve a report (change status to 'approved') and notify reporter
   */
  approveReport(reportId: string): void {
    const currentReports = this.reportsSubject.value;
    const report = currentReports.find((r) => r.id === reportId);

    const updatedReports = currentReports.map((r) =>
      r.id === reportId
        ? { ...r, status: 'approved' as const, updatedAt: new Date().toISOString() }
        : r,
    );
    this.reportsSubject.next(updatedReports);
    this.saveReportsToStorage(updatedReports);

    // Notify the reporter that their report has been approved
    if (report && report.reporterId !== 'ADMIN') {
      this.notificationService.notifyReportAction(
        report.reporterEmail || 'unknown',
        report.reporterName || 'Reporter',
        reportId,
        'approved',
        report.description,
      );
    }
  }

  /**
   * Reject a report and notify reporter
   */
  rejectReport(reportId: string): void {
    const currentReports = this.reportsSubject.value;
    const report = currentReports.find((r) => r.id === reportId);

    const updatedReports = currentReports.map((r) =>
      r.id === reportId
        ? { ...r, status: 'rejected' as const, updatedAt: new Date().toISOString() }
        : r,
    );
    this.reportsSubject.next(updatedReports);
    this.saveReportsToStorage(updatedReports);

    // Notify the reporter that their report has been reviewed
    if (report && report.reporterId !== 'ADMIN') {
      this.notificationService.notifyReportAction(
        report.reporterEmail || 'unknown',
        report.reporterName || 'Reporter',
        reportId,
        'rejected',
        report.description,
      );
    }
  }

  /**
   * Update report fields (admin only)
   */
  updateReport(
    reportId: string,
    changes: Partial<Omit<Report, 'id' | 'status' | 'createdAt'>>,
  ): void {
    const currentReports = this.reportsSubject.value;
    const updatedReports = currentReports.map((r) =>
      r.id === reportId
        ? {
            ...r,
            ...changes,
            updatedAt: new Date().toISOString(),
          }
        : r,
    );
    this.reportsSubject.next(updatedReports);
    this.saveReportsToStorage(updatedReports);
  }

  /**
   * Delete a report permanently
   */
  deleteReport(reportId: string): void {
    const currentReports = this.reportsSubject.value;
    const updatedReports = currentReports.filter((r) => r.id !== reportId);
    this.reportsSubject.next(updatedReports);
    this.saveReportsToStorage(updatedReports);
  }

  /**
   * Send Emergency SOS alert to admins
   */
  sendEmergencySOS(
    userEmail: string,
    userName: string,
    location?: { lat: number; lng: number },
  ): void {
    // Send notification to admin
    this.notificationService.addEmergencySOSAlert(userName, userEmail, location);

    // Also send confirmation to the user
    this.notificationService.addSosNotification();
  }

  /**
   * Generate a unique ID for a report
   */
  private generateId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
