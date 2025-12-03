import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Data } from '../data';
import { Incident, RiskZone } from '../models';
import { AuthService } from '../auth.service';
import { ReportService, Report } from '../report.service';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-map',
  templateUrl: './map.html',
  styleUrl: './map.css',
  imports: [CommonModule],
})
export class Map implements OnInit, OnDestroy {
  private data = inject(Data);
  private auth = inject(AuthService);
  private reportService = inject(ReportService);
  private router = inject(Router);
  private map!: L.Map;
  private readonly BAGUIO_COORDS: L.LatLngExpression = [16.4167, 120.5933];
  // Baguio City approximate bounds
  private readonly BAGUIO_BOUNDS: L.LatLngBoundsExpression = [
    [16.35, 120.52], // Southwest corner
    [16.48, 120.66], // Northeast corner
  ];
  private incidentsLayer: L.LayerGroup = L.layerGroup();
  private eventListenerBound = false;
  private allReports: Report[] = [];
  private reportsSubscription?: Subscription;

  activeFilter: 'all' | 'high' | 'medium' | 'low' = 'all';

  ngOnInit() {
    setTimeout(() => {
      this.initMap();
      this.loadApprovedReports();
    }, 100);

    // Listen for custom event from popup button
    if (!this.eventListenerBound) {
      window.addEventListener('viewIncidentDetail', ((event: CustomEvent) => {
        this.viewReportDetail(event.detail);
      }) as EventListener);
      this.eventListenerBound = true;
    }
  }

  setFilter(filter: 'all' | 'high' | 'medium' | 'low') {
    this.activeFilter = filter;
    this.displayFilteredMarkers();

    // Zoom to filtered markers after a brief delay to allow rendering
    setTimeout(() => {
      this.zoomToFilteredMarkers();
    }, 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    if (this.reportsSubscription) {
      this.reportsSubscription.unsubscribe();
    }
  }

  private initMap(): void {
    if (!this.map) {
      this.map = L.map('mountainSentinelMap', {
        center: this.BAGUIO_COORDS,
        zoom: 13,
        maxBounds: this.BAGUIO_BOUNDS,
        maxBoundsViscosity: 0.5, // Allows slight dragging outside bounds
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 12,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);

      this.incidentsLayer.addTo(this.map);

      // Set initial view to Baguio City bounds
      this.map.fitBounds(this.BAGUIO_BOUNDS);
    }
  }

  private loadApprovedReports(): void {
    // Subscribe to real-time updates of approved reports
    this.reportsSubscription = this.reportService
      .getAllReports()
      .pipe(
        map((reports) => {
          console.log('All reports:', reports);
          const approved = reports.filter((r) => r.status === 'approved');
          console.log(
            'Approved reports with location:',
            approved.filter((r) => r.location),
          );
          return approved;
        }),
      )
      .subscribe((reports) => {
        this.allReports = reports;
        this.displayFilteredMarkers();

        // Auto-zoom to markers when new reports arrive
        if (this.activeFilter === 'all') {
          setTimeout(() => this.zoomToFilteredMarkers(), 300);
        }
      });
  }

  private displayFilteredMarkers(): void {
    this.incidentsLayer.clearLayers();

    const filteredReports =
      this.activeFilter === 'all'
        ? this.allReports
        : this.allReports.filter((report) => report.priority === this.activeFilter);

    filteredReports.forEach((report) => {
      if (!report.location || !report.location.lat || !report.location.lng) {
        return; // Skip reports without location
      }

      const priority = report.priority || 'low';
      const coords: L.LatLngExpression = [report.location.lat, report.location.lng];

      const reportIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: `<div class="marker-pin marker-${priority}" style="
          width: 35px; 
          height: 35px; 
          background-color: ${this.getPriorityColor(priority)}; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          border: 3px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
          position: relative;
          cursor: pointer;
        ">
          <div style="
            position: absolute;
            width: 16px;
            height: 16px;
            background-color: white;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          "></div>
        </div>`,
        iconSize: [35, 35],
        iconAnchor: [17.5, 35],
        popupAnchor: [0, -35],
      });

      const marker = L.marker(coords, { icon: reportIcon });

      // Create rich popup with full report information
      const popupContent = `
        <div style="padding: 12px; min-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: 700; border-bottom: 2px solid ${this.getPriorityColor(priority)}; padding-bottom: 8px;">
            ${report.description}
          </h3>
          
          <div style="margin-bottom: 8px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">
              <strong>Location:</strong><br>
              <span style="margin-left: 16px;">${report.street || 'N/A'}</span><br>
              <span style="margin-left: 16px;">${report.barangay || 'N/A'}, ${report.city || 'Baguio'}</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="font-size: 12px; color: #666;">
              <strong>Status:</strong><br>
              <span style="text-transform: capitalize; color: #28a745; font-weight: 600;">${report.status}</span>
            </div>
            <div style="font-size: 12px; color: #666;">
              <strong>Priority:</strong><br>
              <span style="color: ${this.getPriorityColor(priority)}; font-weight: 700; text-transform: uppercase;">
                ${this.getPriorityIcon(priority)} ${priority}
              </span>
            </div>
          </div>

          ${
            report.reporterName
              ? `
            <div style="font-size: 11px; color: #666; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
              <strong>Reported by:</strong> ${report.reporterName}
            </div>
          `
              : ''
          }

          ${
            report.timestamp || report.createdAt
              ? `
            <div style="font-size: 11px; color: #888; margin-bottom: 12px;">
              📅 ${new Date(report.timestamp || report.createdAt).toLocaleString()}
            </div>
          `
              : ''
          }

          <button 
            onclick="window.dispatchEvent(new CustomEvent('viewIncidentDetail', { detail: '${report.id}' }))"
            style="
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
              width: 100%;
              transition: all 0.3s;
              box-shadow: 0 3px 6px rgba(0,123,255,0.3);
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 12px rgba(0,123,255,0.5)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 6px rgba(0,123,255,0.3)'"
          >
            View Full Report Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 350,
        className: 'custom-popup',
      });

      // Make marker clickable to open popup
      marker.on('click', () => {
        marker.openPopup();
      });

      this.incidentsLayer.addLayer(marker);
    });
  }

  private zoomToFilteredMarkers(): void {
    const filteredReports =
      this.activeFilter === 'all'
        ? this.allReports
        : this.allReports.filter((report) => report.priority === this.activeFilter);

    const reportsWithLocation = filteredReports.filter(
      (r) => r.location && r.location.lat && r.location.lng,
    );

    if (reportsWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        reportsWithLocation.map((r) => [r.location!.lat, r.location!.lng] as L.LatLngExpression),
      );
      this.map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
    } else {
      // If no markers for this filter, return to Baguio City view
      this.map.fitBounds(this.BAGUIO_BOUNDS);
    }
  }

  viewReportDetail(reportId: string): void {
    this.router.navigate(['/report-detail', reportId]);
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }

  private getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟠';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }
}
