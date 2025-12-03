import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, Report } from '../report.service';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  imports: [CommonModule, FormsModule, DatePipe],
})
export class AdminDashboard implements OnInit {
  private reportService = inject(ReportService);

  // Active view: 'pending' or 'approved'
  activeView: 'pending' | 'approved' = 'pending';

  // Observable for pending reports
  pendingReports$: Observable<Report[]> = this.reportService.getPendingReports();

  // Observable for approved reports
  approvedReports$: Observable<Report[]> = this.reportService.getApprovedReports();

  // Filtering for approved reports
  approvedFilterPriority: 'all' | 'high' | 'medium' | 'low' = 'all';
  approvedFilterSearch: string = '';

  // Editing state
  editingId: string | null = null;
  editBuffer: Partial<Report> = {};

  ngOnInit(): void {
    // Component initialization
  }

  // Switch between views
  switchView(view: 'pending' | 'approved'): void {
    this.activeView = view;
  }

  // Filter approved reports by priority
  filterByPriority(reports: Report[]): Report[] {
    if (this.approvedFilterPriority === 'all') {
      return reports;
    }
    return reports.filter((r) => r.priority === this.approvedFilterPriority);
  }

  // Filter approved reports by search term
  filterBySearch(reports: Report[]): Report[] {
    if (!this.approvedFilterSearch.trim()) {
      return reports;
    }
    const search = this.approvedFilterSearch.toLowerCase();
    return reports.filter(
      (r) =>
        r.description?.toLowerCase().includes(search) ||
        r.barangay?.toLowerCase().includes(search) ||
        r.street?.toLowerCase().includes(search) ||
        r.reporterName?.toLowerCase().includes(search),
    );
  }

  // Apply all filters to approved reports
  getFilteredApprovedReports(reports: Report[]): Report[] {
    let filtered = this.filterByPriority(reports);
    filtered = this.filterBySearch(filtered);
    return filtered;
  }

  // Reset filters
  resetFilters(): void {
    this.approvedFilterPriority = 'all';
    this.approvedFilterSearch = '';
  }

  // Start editing a report
  startEdit(report: Report): void {
    this.editingId = report.id;
    this.editBuffer = {
      reporterId: report.reporterId,
      reporterName: report.reporterName,
      description: report.description,
      street: report.street,
      barangay: report.barangay,
      imageUrl: report.imageUrl,
    };
  }

  // Cancel editing
  cancelEdit(): void {
    this.editingId = null;
    this.editBuffer = {};
  }

  // Save edits
  saveEdit(reportId: string): void {
    if (this.editingId === reportId) {
      const updates: Partial<Omit<Report, 'id' | 'status' | 'createdAt'>> = {
        reporterId: this.editBuffer.reporterId,
        reporterName: this.editBuffer.reporterName,
        description: this.editBuffer.description,
        street: this.editBuffer.street,
        barangay: this.editBuffer.barangay,
        imageUrl: this.editBuffer.imageUrl,
      };
      this.reportService.updateReport(reportId, updates);
      alert('Report updated successfully');
      this.cancelEdit();
    }
  }

  // Approve a report
  approveReport(reportId: string): void {
    if (confirm('Are you sure you want to approve this report?')) {
      this.reportService.approveReport(reportId);
      alert('Report approved and published to user dashboard');
    }
  }

  // Delete a report
  deleteReport(reportId: string): void {
    if (confirm('Are you sure you want to delete this report permanently?')) {
      this.reportService.deleteReport(reportId);
      alert('Report deleted');
    }
  }

  // Delete approved report (removes from user dashboard)
  deleteApprovedReport(reportId: string): void {
    if (
      confirm(
        '⚠️ This will permanently delete this approved report and remove it from the user dashboard and map. Continue?',
      )
    ) {
      this.reportService.deleteReport(reportId);
      alert('✓ Approved report deleted successfully');
    }
  }
}
