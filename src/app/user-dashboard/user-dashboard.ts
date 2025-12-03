import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { ReportService, Report } from '../report.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, AsyncPipe, DatePipe],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard {
  private reportService = inject(ReportService);

  // Subscribe to all reports and filter for approved ones
  approvedReports$: Observable<Report[]> = this.reportService.getAllReports().pipe(
    map((reports) => reports.filter((r) => r.status === 'approved')),
  );
}
