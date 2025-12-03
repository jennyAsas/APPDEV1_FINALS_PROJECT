import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportService, Report } from '../report.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-report-detail',
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.css',
  imports: [CommonModule],
})
export class ReportDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportService = inject(ReportService);

  reportId: string | null = this.route.snapshot.paramMap.get('id');
  report$: Observable<Report | undefined> = this.reportService.getAllReports().pipe(
    map((reports) => reports.find((r) => r.id === this.reportId)),
  );

  ngOnInit(): void {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'approved':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'rejected':
        return '#f44336';
      default:
        return '#999';
    }
  }
}
