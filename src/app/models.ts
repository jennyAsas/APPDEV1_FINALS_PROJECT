// src/app/models.ts

import { Timestamp } from '@angular/fire/firestore';

export interface FeedItem {
  id: string;
  type: 'incident' | 'alert';
  createdAt: Timestamp;
}

export interface Incident extends FeedItem {
  type: 'incident';
  // status now includes approval flow for admin moderation
  status: 'pending' | 'approved' | 'declined' | 'assigned' | 'resolved';
  location: { lat: number; lng: number };
  description: string;
  priority: 'low' | 'medium' | 'high';
  // the user who created/reported this incident (uid or email)
  createdBy?: string;
  // contact information supplied by the reporter
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  /**
   * Controls which dashboard(s) should show this incident.
   * - 'admin' = visible only in admin dashboard
   * - 'users' = visible only in user-facing dashboard / map
   * - 'both' = visible everywhere (default for backwards compatibility)
   */
  recipient?: 'admin' | 'users' | 'both';
}

export interface Alert extends FeedItem {
  type: 'alert';
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
}

export interface RiskZone {
  id: string;
  name: string;
  geojson: any; // Leaflet GeoJSON data
  riskLevel: 'low' | 'medium' | 'high';
}
