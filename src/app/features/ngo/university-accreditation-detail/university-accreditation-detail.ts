import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';

import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';

import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { AppRoutes } from '../../../core/constants/app-routes';
import { AccreditationService } from '../../../core/services/ngo/accreditation.service';
import { UniversityAccreditationModel } from '../../../core/models/ngo/accreditation/university-accreditation.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-university-accreditation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './university-accreditation-detail.html',
  styleUrl: './university-accreditation-detail.scss',
})
export class UniversityAccreditationDetail implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isStatusDropdownOpen = false;
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private universityService = inject(MasterUniversityService);
  private countryService = inject(MasterCountryService);
  private notification = inject(NotificationService);
  private accreditationService = inject(AccreditationService);

  university = new MasterUniversityRequest();
  selectedStatus = AccreditationStatus.Pending;
  comment = '';
  isStatusDropdownOpen = false;

  // Expose enum to the template
  readonly AccreditationStatus = AccreditationStatus;

  countries: MasterCountryRequest[] = [];
  countryMap = new Map<number, string>();

  ngOnInit(): void {
    this.loadCountries();
  }

  loadCountries(): void {
    const countryFilter = new MasterCountryFilter();
    countryFilter.pageNumber = 1;
    countryFilter.pageSize = 1000;

    this.countryService.getMasterCountries(countryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countries = response.result.items;
          this.buildCountryMap();
        }

        const registrationId = Number(this.route.snapshot.params['registrationId']);
        if (registrationId) {
          this.loadUniversity(registrationId);
        }
      },
      error: (error) => {
        const registrationId = Number(this.route.snapshot.params['registrationId']);
        if (registrationId) {
          this.loadUniversity(registrationId);
        }
        this.notification.handleBusinessError(
          error,
          'Failed to load countries.'
        );
      }
    });
  }

  buildCountryMap(): void {
    this.countryMap.clear();
    this.countries.forEach(c => {
      if (c.countryId) {
        this.countryMap.set(c.countryId, c.countryName);
      }
    });
  }

  getCountryName(countryId: number): string {
    return this.countryMap.get(countryId) || 'Unknown';
  }

  loadUniversity(id: number): void {
    this.universityService.getMasterUniversityById(id).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.university = response.result;
          this.selectedStatus = this.university.accreditationStatus || AccreditationStatus.Pending;
          this.comment = this.university.committeeComment || '';
        } else {
          this.notification.error('Failed to load university details.');
          this.backToList();
        }
      },
      error: (error) => {
        this.backToList();
        this.notification.handleBusinessError(
          error,
          'Failed to retrieve university details.'
        );
      }
    });
  }

  getStatusLabel(status?: number): string {
    switch (status) {
      case AccreditationStatus.Pending:
        return 'Pending';
      case AccreditationStatus.Accredited:
        return 'Accredited';
      case AccreditationStatus.Rejected:
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  getBadgeClass(status?: number): string {
    switch (status) {
      case AccreditationStatus.Pending: return 'badge-pending';
      case AccreditationStatus.Accredited: return 'badge-accredited';
      case AccreditationStatus.Rejected: return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  selectStatus(status: number): void {
    this.selectedStatus = status;
    this.isStatusDropdownOpen = false;
  }

  updateDecision(): void {

    const payload = new UniversityAccreditationModel();
    payload.universityId = this.university.universityId!;
    payload.accreditationStatus = this.selectedStatus;
    payload.committeeComment = this.comment;
    payload.updatedBy = 0; // backend/current-user handling if applicable

    this.accreditationService.accreditUniversity(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Accreditation decision updated successfully.');
          this.loadUniversity(this.university.universityId!);
        } else {
          this.notification.error(response.message || 'Failed to update decision.');
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to update accreditation decision.'
        );
      }
    });
  }

  backToList(): void {
    this.router.navigate([AppRoutes.Ngo.UniversityAccreditation]);
  }
}
