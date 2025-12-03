// src/app/alert-form/alert-form.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Data } from '../data';
import { Alert } from '../models'; //

@Component({
  standalone: true,
  selector: 'app-alert-form',
  templateUrl: './alert-form.html',
  styleUrl: './alert-form.css',
  imports: [CommonModule, FormsModule],
})
export class AlertForm {
  private data = inject(Data);

  alertData: Partial<Alert> & { message: string; priority: 'low' | 'medium' | 'high' } = {
    message: '',
    priority: 'medium', // Default priority
    createdBy: 'Admin',
  };
  async submitAlert() {
    if (!this.alertData.message) {
      alert('Alert message cannot be empty.');
      return;
    }

    try {
      const alertId = await this.data.issueAlert(this.alertData);
      alert(`Alert issued successfully! ID: ${alertId}`);
      this.alertData.message = '';
      this.alertData.priority = 'medium';
    } catch (e) {
      console.error('Error issuing alert:', e);
      alert('Failed to issue alert. Check console.');
    }
  }
}
