import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { AppRoutes } from '../../../core/constants/app-routes';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { ValidationPatterns } from '../../../core/constants/validation-patterns';
import { PhoneValidatorDirective } from '../../../shared/directives/phone-validator.directive';

@Component({
  selector: 'app-university-registration',
  imports: [CommonModule, FormsModule, PhoneValidatorDirective],
  templateUrl: './university-registration.html',
  styleUrl: './university-registration.scss',
})
export class UniversityRegistration implements OnInit {

  private notification = inject(NotificationService);
  private masterDropDownService = inject(MasterDropDownService);
  private masterCountryService = inject(MasterCountryService);
  private masterUniversityService = inject(MasterUniversityService);
  private router = inject(Router);

  university: MasterUniversityRequest = new MasterUniversityRequest();
  validationPatterns = ValidationPatterns;
  countries: MasterCountryRequest[] = [];
  universityType: MasterDropDownRequest[] = [];
  studentGenders: MasterDropDownRequest[] = [];

  // Accordion state
  activeSection = 1;

  // Dropdown visibility flags
  isCountryDropdownOpen = false;
  isUniversityTypeDropdownOpen = false;
  isGenderDropdownOpen = false;
  isVcPhoneDropdownOpen = false;
  isCoordPhoneDropdownOpen = false;

  // Phone input local state
  VcCountryId: number | null = null;
  VcCountryCode = '';
  VcPhoneNumber = '';

  CoordCountryId: number | null = null;
  CoordCountryCode = '';
  CoordPhoneNumber = '';

  ngOnInit(): void {
    this.university.isDraft = true;
    this.university.isActive = true;
    this.university.accreditationStatus = 0; // Default to Pending/Draft

    this.getCountries();
    this.getUniversityType();
    this.getStudentGenders();
  }

  // Close dropdowns on document click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select')) {
      this.closeAllDropdowns();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAllDropdowns();
  }

  closeAllDropdowns(): void {
    this.isCountryDropdownOpen = false;
    this.isUniversityTypeDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isVcPhoneDropdownOpen = false;
    this.isCoordPhoneDropdownOpen = false;
  }

  setActiveSection(section: number): void {
    this.activeSection = section;
  }

  toggleSection(section: number): void {
    if (this.activeSection === section) {
      this.activeSection = 0; // collapse
    } else {
      this.activeSection = section;
    }
  }

  // Country Selection
  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isCountryDropdownOpen;
    this.closeAllDropdowns();
    this.isCountryDropdownOpen = !current;
  }

  selectCountry(countryId: number): void {
    this.university.countryId = countryId;
    this.isCountryDropdownOpen = false;

    const selectedC = this.countries.find(c => c.countryId === countryId);
    if (selectedC) {
      this.VcCountryId = selectedC.countryId || null;
      this.VcCountryCode = selectedC.countryIsdCode?.toString() || '';

      this.CoordCountryId = selectedC.countryId || null;
      this.CoordCountryCode = selectedC.countryIsdCode?.toString() || '';
    }
  }

  clearCountry(event: Event): void {
    event.stopPropagation();
    this.university.countryId = 0;
    this.VcCountryId = null;
    this.VcCountryCode = '';
    this.CoordCountryId = null;
    this.CoordCountryCode = '';
  }

  getSelectedCountryName(): string {
    const selected = this.countries.find(c => c.countryId === this.university.countryId);
    return selected ? selected.countryName || 'Select Country...' : 'Select Country...';
  }

  // University Type Selection
  toggleUniversityTypeDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isUniversityTypeDropdownOpen;
    this.closeAllDropdowns();
    this.isUniversityTypeDropdownOpen = !current;
  }

  selectUniversityType(type: string): void {
    this.university.universityType = type;
    this.isUniversityTypeDropdownOpen = false;
  }

  clearUniversityType(event: Event): void {
    event.stopPropagation();
    this.university.universityType = '';
  }

  getSelectedUniversityTypeName(): string {
    return this.university.universityType ? this.university.universityType : 'Select Type...';
  }

  // Student Genders Selection
  toggleGenderDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isGenderDropdownOpen;
    this.closeAllDropdowns();
    this.isGenderDropdownOpen = !current;
  }

  selectGender(gender: string): void {
    this.university.studentsGender = gender;
    this.isGenderDropdownOpen = false;
  }

  clearGender(event: Event): void {
    event.stopPropagation();
    this.university.studentsGender = '';
  }

  getSelectedGenderName(): string {
    return this.university.studentsGender ? this.university.studentsGender : 'Select Gender...';
  }

  // VC Phone Selection
  toggleVcPhoneDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isVcPhoneDropdownOpen;
    this.closeAllDropdowns();
    this.isVcPhoneDropdownOpen = !current;
  }

  selectVcPhoneCountry(c: MasterCountryRequest): void {
    this.VcCountryId = c.countryId || null;
    this.VcCountryCode = c.countryIsdCode?.toString() || '';
    this.isVcPhoneDropdownOpen = false;
  }

  clearVcPhone(event: Event): void {
    event.stopPropagation();
    this.VcCountryId = null;
    this.VcCountryCode = '';
  }

  getVcPhoneCountryName(): string {
    const found = this.countries.find(c => c.countryId === this.VcCountryId);
    return found ? `${found.countryName} (+${found.countryIsdCode})` : 'Select Code...';
  }

  // Coordinator Phone Selection
  toggleCoordPhoneDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isCoordPhoneDropdownOpen;
    this.closeAllDropdowns();
    this.isCoordPhoneDropdownOpen = !current;
  }

  selectCoordPhoneCountry(c: MasterCountryRequest): void {
    this.CoordCountryId = c.countryId || null;
    this.CoordCountryCode = c.countryIsdCode?.toString() || '';
    this.isCoordPhoneDropdownOpen = false;
  }

  clearCoordPhone(event: Event): void {
    event.stopPropagation();
    this.CoordCountryId = null;
    this.CoordCountryCode = '';
  }

  getCoordPhoneCountryName(): string {
    const found = this.countries.find(c => c.countryId === this.CoordCountryId);
    return found ? `${found.countryName} (+${found.countryIsdCode})` : 'Select Code...';
  }

  getCountries(): void {
    const filter = new MasterCountryFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;

    this.masterCountryService.getMasterCountries(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countries = response.result.items;
          return;
        } this.countries = [];
        this.notification.warning(
          response.message || 'Failed to load countries.'
        );
      },
      error: (error) => {
        this.countries = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load countries.'
        );
      }
    });
  }

  getUniversityType(): void {
    this.masterDropDownService
      .getByParentId(MainDropdown.UniversityType)
      .subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.universityType = response.result;
            return;
          }
          this.universityType = [];
          this.notification.warning(
            response.message || 'Failed to load university types.'
          );
        },
        error: (error) => {
          this.universityType = [];
          this.notification.handleBusinessError(
            error,
            'Failed to load university types.'
          );
        }
      });
  }

  getStudentGenders(): void {
    this.masterDropDownService
      .getByParentId(MainDropdown.StudentGenderEligibility)
      .subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.studentGenders = response.result;
            return;
          }
          this.studentGenders = [];
          this.notification.warning(
            response.message || 'Failed to load student genders.'
          );
        },
        error: (error) => {
          this.studentGenders = [];
          this.notification.handleBusinessError(
            error,
            'Failed to load student genders.'
          );
        }
      });
  }

  goToLogin(): void {
    this.router.navigate([AppRoutes.Common.Login]);
  }

  saveDraft(): void {
    this.notification.success('Draft saved successfully.');
  }

  submitRegistration(form: NgForm): void {
    if (!form.valid) {
      this.notification.warning('Please fix validation errors.');
      return;
    }

    if (!this.university.countryId) {
      this.notification.warning('Please select a country');
      return;
    }

    if (!this.university.universityType) {
      this.notification.warning('Please select university type');
      return;
    }

    // Phone numbers formatting
    if (this.VcCountryCode && this.VcPhoneNumber) {
      const prefix = this.VcCountryCode.startsWith('+') ? this.VcCountryCode : '+' + this.VcCountryCode;
      this.university.vcMobile = `${prefix}${this.VcPhoneNumber.replace(/\D/g, '')}`;
    }

    if (this.CoordCountryCode && this.CoordPhoneNumber) {
      const prefix = this.CoordCountryCode.startsWith('+') ? this.CoordCountryCode : '+' + this.CoordCountryCode;
      this.university.coordPhone = `${prefix}${this.CoordPhoneNumber.replace(/\D/g, '')}`;
    }

    this.university.isDraft = false;
    this.university.isActive = true;
    this.university.accreditationStatus = AccreditationStatus.Pending;

    this.masterUniversityService.addMasterUniversity(this.university).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(response.message || 'University registered successfully.');
          this.goToLogin();
          return;
        }
        this.notification.error(
          response.message || 'Failed to register university.'
        );
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to register university.'
        );
      }
    });
  }

}
