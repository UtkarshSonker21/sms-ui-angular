import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterSchoolRequest } from '../../../core/models/school/master-school/master-school-request.model';

import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';

import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { AppRoutes } from '../../../core/constants/app-routes';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { AccreditationService } from '../../../core/services/ngo/accreditation.service';
import { SchoolAccreditationModel } from '../../../core/models/ngo/accreditation/school-accreditation.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-school-accreditation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './school-accreditation-detail.html',
  styleUrl: './school-accreditation-detail.scss',
})
export class SchoolAccreditationDetail implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isStatusDropdownOpen = false;
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schoolService = inject(MasterSchoolService);
  private countryService = inject(MasterCountryService);
  private dropdownService = inject(MasterDropDownService);
  private notification = inject(NotificationService);
  private accreditationService = inject(AccreditationService);

  school = new MasterSchoolRequest();
  selectedStatus = 1; // 1 = Pending, 2 = Accredited (Accepted), 3 = Rejected
  comment = '';
  isStatusDropdownOpen = false;

  countries: MasterCountryRequest[] = [];
  countryMap = new Map<number, string>();

  schoolTypes: MasterDropDownRequest[] = [];
  schoolTypeMap = new Map<number, string>();

  ngOnInit(): void {
    this.loadCountries();
    this.loadSchoolTypes();
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

        const schoolId = Number(this.route.snapshot.params['schoolId']);
        if (schoolId) {
          this.loadSchool(schoolId);
        }
      },
      error: () => {
        const schoolId = Number(this.route.snapshot.params['schoolId']);
        if (schoolId) {
          this.loadSchool(schoolId);
        }
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
    return this.countryMap.get(countryId) || 'N/A';
  }

  loadSchoolTypes(): void {
    this.dropdownService.getByParentId(MainDropdown.SchoolType).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.schoolTypes = response.result;
          this.buildSchoolTypeMap();
        }
      }
    });
  }

  buildSchoolTypeMap(): void {
    this.schoolTypeMap.clear();
    this.schoolTypes.forEach(t => {
      if (t.uniqueId) {
        this.schoolTypeMap.set(t.uniqueId, t.displayText);
      }
    });
  }

  getSchoolTypeName(schoolType: number): string {
    return this.schoolTypeMap.get(schoolType) || 'N/A';
  }

  loadSchool(id: number): void {
    this.schoolService.getMasterSchoolById(id).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.school = response.result;
          this.selectedStatus = this.school.accreditationStatus || 1;
          this.comment = this.school.committeeComment || '';
        } else {
          this.notification.error('Failed to load school details.');
          this.backToList();
        }
      },
      error: () => {
        this.notification.error('Failed to retrieve school details.');
        this.backToList();
      }
    });
  }

  getStatusLabel(status?: number): string {
    switch (status) {
      case AccreditationStatus.Pending:
        return 'Pending';

      case AccreditationStatus.Accredited:
        return 'Accepted';

      case AccreditationStatus.Rejected:
        return 'Rejected';

      default:
        return 'Pending';
    }
  }

  getBadgeClass(status?: number): string {
    switch (status) {
      case 1: return 'badge-pending';
      case 2: return 'badge-accredited'; // Matches green color badge style
      case 3: return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  selectStatus(status: number): void {
    this.selectedStatus = status;
    this.isStatusDropdownOpen = false;
  }

  updateDecision(): void {

    const payload = new SchoolAccreditationModel();
    payload.schoolId = this.school.schoolId!;
    payload.accreditationStatus = this.selectedStatus;
    payload.committeeComment = this.comment;
    payload.updatedBy = 0; // backend/current-user handling if applicable

    this.accreditationService.accreditSchool(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Accreditation decision updated successfully.');
          this.loadSchool(this.school.schoolId!);
        } else {
          this.notification.error(response.message || 'Failed to update decision.');
        }
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error?.error?.message ||
          error?.error?.Message ||
          error?.message ||
          'Failed to update accreditation decision.';

        this.notification.error(message);
      }
    });
  }

  backToList(): void {
    this.router.navigate(['school-accreditation']);
  }
}
