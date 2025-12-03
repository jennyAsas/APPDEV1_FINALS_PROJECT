import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { ReportService, Report } from '../report.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-safety-feed',
  templateUrl: './safety-feed.html',
  styleUrl: './safety-feed.css',
  imports: [CommonModule, AsyncPipe, DatePipe],
})
export class SafetyFeed {
  private reportService = inject(ReportService);

  // Display only approved reports in real-time
  approvedReports$: Observable<Report[]> = this.reportService.getAllReports().pipe(
    map((reports) => reports.filter((r) => r.status === 'approved')),
  );
}
