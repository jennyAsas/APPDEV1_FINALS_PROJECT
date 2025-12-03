// src/app/report/report.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ReportService } from '../report.service';
import { firstValueFrom } from 'rxjs';
import { Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-report',
  templateUrl: './report.html',
  styleUrl: './report.css',
  imports: [CommonModule, FormsModule, RouterModule],
})
export class Report implements OnInit {
  private reportService = inject(ReportService);
  public authService = inject(AuthService);
  private router = inject(Router);

  // Report form fields
  description = '';
  street = '';
  barangay = '';
  landmark = '';
  city = 'Baguio City';
  priority: 'low' | 'medium' | 'high' = 'medium';
  fullName = '';
  email = '';
  idImageUrl: string | null = null;
  idImageFile: File | null = null;
  idImageFileName: string | null = null;
  proofImageUrl: string | null = null;
  proofImageFile: File | null = null;
  proofImageFileName: string | null = null;
  location: { lat: number; lng: number } | null = null;
  locationAccuracy: number | null = null;
  isGettingLocation: boolean = false;
  locationError: string | null = null;

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;
  validationErrors: { [key: string]: string } = {};

  // Baguio City barangays
  baguioBarangays: string[] = [
    'A. Bonifacio-Caguioa-Rimando (ABCR)',
    'Abanao-Zandueta-Kayong-Chugum-Otek (AZKCO)',
    'Alfonso Tabora',
    'Ambiong',
    'Andres Bonifacio (Lower Bokawkan)',
    'Apugan-Loakan',
    'Asin Road',
    'Atok Trail',
    'Aurora Hill Proper (Malvar-Sgt. Floresca)',
    'Aurora Hill, North Central',
    'Aurora Hill, South Central',
    'Bagong Lipunan (Market Area)',
    'Baguio Dairy Farm',
    'Bakakeng Central',
    'Bakakeng North',
    'Bal-Marcoville (Marcoville)',
    'Balsigan',
    'Bayan Park East',
    'Bayan Park Village',
    'Bayan Park West (Bayan Park)',
    'BGH Compound',
    'Brookside',
    'Brookspoint',
    "Cabinet Hill-Teacher's Camp",
    'Camdas Subdivision',
    'Camp 7',
    'Camp 8',
    'Camp Allen',
    'Campo Filipino',
    'City Camp Central',
    'City Camp Proper',
    'Country Club Village',
    'Cresencia Village',
    'Dagisitan',
    'Dagsian, Lower',
    'Dagsian, Upper',
    'Dizon Subdivision',
    'Dominican Hill-Mirador',
    'Dontogan',
    'DPS Area',
    "Engineers' Hill",
    'Fairview Village',
    'Ferdinand (Happy Homes-Campo Sioco)',
    'Fort del Pilar',
    'Gabriel Silang',
    'General Emilio F. Aguinaldo (Quirino-Magsaysay, Upper)',
    'General Luna, Lower',
    'General Luna, Upper',
    'Gibraltar',
    'Greenwater Village',
    'Guisad Central',
    'Guisad Sorong',
    'Happy Hollow',
    'Happy Homes (Happy Homes-Lucban)',
    'Harrison-Claudio Carantes',
    'Hillside',
    'Holy Ghost Extension',
    'Holy Ghost Proper',
    'Honeymoon (Honeymoon-Holy Ghost)',
    'Imelda R. Marcos (La Salle)',
    'Imelda Village',
    'Irisan',
    'Kabayanihan',
    'Kagitingan',
    'Kayang Extension',
    'Kayang-Hilltop',
    'Kias',
    'Legarda-Burnham-Kisad',
    'Liwanag-Loakan',
    'Loakan Proper',
    'Lopez Jaena',
    'Lourdes Subdivision Extension',
    'Lourdes Subdivision, Lower',
    'Lourdes Subdivision, Proper',
    'Lualhati',
    'Lucnab',
    'Magsaysay Private Road',
    'Magsaysay, Lower',
    'Magsaysay, Upper',
    'Malcolm Square-Perfecto (Jose Abad Santos)',
    'Manuel A. Roxas',
    'Market Subdivision, Upper',
    'Middle Quezon Hill Subdivision (Quezon Hill Middle)',
    'Military Cut-off',
    'Mines View Park',
    'Modern Site, East',
    'Modern Site, West',
    'MRR-Queen of Peace',
    'New Lucban',
    'Outlook Drive',
    'Pacdal',
    'Padre Burgos',
    'Padre Zamora',
    'Palma-Urbano (Cariño-Palma)',
    'Phil-Am',
    'Pinget',
    'Pinsao Pilot Project',
    'Pinsao Proper',
    'Poliwes',
    'Pucsusan',
    'Quezon Hill Proper',
    'Quezon Hill, Upper',
    'Quirino Hill, East',
    'Quirino Hill, Lower',
    'Quirino Hill, Middle',
    'Quirino Hill, West',
    'Quirino-Magsaysay, Lower (Quirino-Magsaysay, West)',
    'Rizal Monument Area',
    'Rock Quarry, Lower',
    'Rock Quarry, Middle',
    'Rock Quarry, Upper',
    'Salud Mitra',
    'San Antonio Village',
    'San Luis Village',
    'San Roque Village',
    'San Vicente',
    'Sanitary Camp, North',
    'Sanitary Camp, South',
    'Santa Escolastica',
    'Santo Rosario',
    'Santo Tomas Proper',
    'Santo Tomas School Area',
    'Scout Barrio',
    'Session Road Area',
    'Slaughter House Area (Santo Niño Slaughter)',
    'SLU-SVP Housing Village',
    'South Drive',
    'Teodora Alonzo',
    'Trancoville',
    'Upper General Luna',
    'Victoria Village',
    'Websters Subdivision',
  ];

  filteredBarangays: string[] = [...this.baguioBarangays];
  showBarangaySuggestions: boolean = false;

  ngOnInit(): void {
    // Load user info from auth
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.email = user.email || '';
        this.fullName = user.displayName || '';
      }
    });

    // Load any existing form data from sessionStorage if available
    const savedData = sessionStorage.getItem('reportFormData');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.description = data.description || '';
      this.street = data.street || '';
      this.barangay = data.barangay || '';
      this.landmark = data.landmark || '';
      this.priority = data.priority || 'medium';
    }
  }

  filterBarangays(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    this.showBarangaySuggestions = true;
    if (!input) {
      this.filteredBarangays = [...this.baguioBarangays];
      return;
    }
    this.filteredBarangays = this.baguioBarangays.filter((b) => b.toLowerCase().includes(input));
  }

  selectBarangay(barangay: string): void {
    this.barangay = barangay;
    this.showBarangaySuggestions = false;
    this.filteredBarangays = [...this.baguioBarangays];
  }

  async getAddressFromCoordinates(lat: number, lng: number): Promise<void> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      );
      const data = await response.json();

      if (data && data.address) {
        // Extract street and neighborhood/suburb information
        const address = data.address;
        const street = address.road || address.street || address.neighbourhood || '';
        const suburb = address.suburb || address.neighbourhood || address.quarter || '';

        // Auto-fill street if available
        if (street && !this.street) {
          this.street = street;
        }

        // Try to match detected suburb/neighbourhood with our barangay list
        if (suburb) {
          const matchedBarangay = this.baguioBarangays.find(
            (b) =>
              b.toLowerCase().includes(suburb.toLowerCase()) ||
              suburb.toLowerCase().includes(b.toLowerCase().split('(')[0].trim().toLowerCase()),
          );

          if (matchedBarangay && !this.barangay) {
            this.barangay = matchedBarangay;
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch address details:', error);
      // Don't show error to user - this is just a helpful suggestion
    }
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by your browser.';
      return;
    }

    this.isGettingLocation = true;
    this.locationError = null;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Check if location is within Baguio City bounds
        if (lat >= 16.35 && lat <= 16.48 && lng >= 120.52 && lng <= 120.66) {
          this.location = { lat, lng };
          this.locationAccuracy = position.coords.accuracy;
          this.locationError = null;

          // Automatically suggest street and barangay based on coordinates
          await this.getAddressFromCoordinates(lat, lng);
        } else {
          this.locationError =
            'Your location is outside Baguio City. Please ensure you are within Baguio City to report an incident.';
          this.location = null;
        }
        this.isGettingLocation = false;
      },
      (error) => {
        this.isGettingLocation = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError =
              'Location access denied. Please enable location access to submit a report.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError =
              'Location information unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            this.locationError = 'Location request timed out. Please try again.';
            break;
          default:
            this.locationError = 'Unable to get your location. Please try again.';
        }
        this.location = null;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  onProofImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Proof image must be less than 5MB.';
        return;
      }
      this.proofImageFile = file;
      this.proofImageFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.proofImageUrl = e.target?.result as string;
        this.successMessage = 'Proof image uploaded successfully!';
        setTimeout(() => {
          if (this.successMessage === 'Proof image uploaded successfully!') {
            this.successMessage = null;
          }
        }, 3000);
      };
      reader.readAsDataURL(file);
    }
  }

  onIdImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'ID image must be less than 5MB.';
        return;
      }
      this.idImageFile = file;
      this.idImageFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.idImageUrl = e.target?.result as string;
        this.successMessage = 'ID image uploaded successfully!';
        setTimeout(() => {
          if (this.successMessage === 'ID image uploaded successfully!') {
            this.successMessage = null;
          }
        }, 3000);
      };
      reader.readAsDataURL(file);
    }
  }

  validateForm(): boolean {
    this.validationErrors = {};

    if (!this.description.trim()) {
      this.validationErrors['description'] = 'Incident description is required.';
    }
    if (!this.fullName.trim()) {
      this.validationErrors['fullName'] = 'Full name is required.';
    }
    if (!this.email.trim() || !this.isValidEmail(this.email)) {
      this.validationErrors['email'] = 'Valid email address is required.';
    }
    if (!this.street.trim()) {
      this.validationErrors['street'] = 'Street address is required.';
    }
    if (!this.barangay.trim()) {
      this.validationErrors['barangay'] = 'Barangay is required.';
    }
    if (!this.location) {
      this.validationErrors['location'] =
        'Real-time location is required. Please enable location access.';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    try {
      // Ensure caller is logged in
      const user = await firstValueFrom(this.authService.currentUser$);
      if (!user) {
        this.errorMessage = 'You must be logged in to submit a report. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 900);
        this.isLoading = false;
        return;
      }

      // Validate location one more time before submission
      if (!this.location) {
        this.errorMessage = 'Location is required. Please enable location access and try again.';
        this.isLoading = false;
        return;
      }

      // Submit the report using ReportService
      const reportPayload = {
        reporterId: user.uid || user.email || 'unknown',
        reporterName: this.fullName.trim(),
        reporterEmail: this.email.trim(),
        description: this.description.trim(),
        street: this.street.trim(),
        barangay: this.barangay.trim(),
        landmark: this.landmark.trim() || undefined,
        city: this.city,
        priority: this.priority,
        location: this.location,
        locationAccuracy: this.locationAccuracy ?? undefined,
        timestamp: new Date().toISOString(),
        imageUrl: this.proofImageUrl || undefined,
        idImageUrl: this.idImageUrl || undefined,
      };

      await firstValueFrom(this.reportService.submitReport(reportPayload));

      this.successMessage = 'Report submitted successfully and is awaiting admin approval.';

      // Clear form and save to sessionStorage for reference
      this.clearForm();
      sessionStorage.removeItem('reportFormData');
    } catch (error: any) {
      console.error('Report submission failed: - report.ts:120', error);
      this.errorMessage = 'Submission failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private clearForm(): void {
    this.description = '';
    this.street = '';
    this.barangay = '';
    this.landmark = '';
    this.priority = 'medium';
    this.proofImageUrl = null;
    this.proofImageFile = null;
    this.proofImageFileName = null;
    this.idImageUrl = null;
    this.idImageFile = null;
    this.idImageFileName = null;
    this.location = null;
    this.locationAccuracy = null;
    this.locationError = null;
    // Don't clear fullName and email as they're from auth
  }

  saveFormProgress(): void {
    const formData = {
      description: this.description,
      street: this.street,
      barangay: this.barangay,
      landmark: this.landmark,
      priority: this.priority,
    };
    sessionStorage.setItem('reportFormData', JSON.stringify(formData));
  }
}
