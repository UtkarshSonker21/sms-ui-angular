import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCurrencyFilter } from '../../../core/models/super-admin/master-currency/master-currency-filter.model';
import { MasterCurrencyRequest } from '../../../core/models/super-admin/master-currency/master-currency-request.model';
import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCurrencyService } from '../../../core/services/superadmin/master-currency.service';
import { AppRoutes } from '../../../core/constants/app-routes';
import { MasterSchoolRequest } from '../../../core/models/school/master-school/master-school-request.model';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { ValidationPatterns } from '../../../core/constants/validation-patterns';
import { PhoneValidatorDirective } from '../../../shared/directives/phone-validator.directive';

@Component({
  selector: 'app-school-registration',
  imports: [CommonModule, FormsModule, PhoneValidatorDirective],
  templateUrl: './school-registration.html',
  styleUrl: './school-registration.scss',
})
export class SchoolRegistration implements OnInit {

  private masterCountryService = inject(MasterCountryService);
  private masterCurrencyService = inject(MasterCurrencyService);
  private masterSchoolService = inject(MasterSchoolService);
  private notification = inject(NotificationService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private masterDropDownService = inject(MasterDropDownService);
  private router = inject(Router);
  school: MasterSchoolRequest = new MasterSchoolRequest();
  validationPatterns = ValidationPatterns;

  isCoordinatorMode = false;

  // Accordion & Stepper state
  activeSection = 1;

  // Dropdown open flags
  isSchoolTypeDropdownOpen = false;
  isCountryDropdownOpen = false;
  isPhoneCountryDropdownOpen = false;
  isPrincipalPhoneDropdownOpen = false;
  isCoordinatorPhoneDropdownOpen = false;
  isCurrencyDropdownOpen = false;
  isStatusDropdownOpen = false;
  isLanguageDropdownOpen = false;
  isAccreditationDropdownOpen = false;
  isIslamicDropdownOpen = false;

  customLanguage = '';
  customAccreditation = '';

  get selectedLanguagesList(): string[] {
    return this.school.schoolTeachingLanguage ? this.school.schoolTeachingLanguage.split(', ').filter(x => x) : [];
  }

  get selectedAccreditationsList(): string[] {
    return this.school.schoolAccreditations ? this.school.schoolAccreditations.split(', ').filter(x => x) : [];
  }

  // Phone state variables
  selectedIsdCode = '';
  localPhoneNumber = '';

  PrincipalCountryId: number | null = null;
  PrincipalCountryCode = '';
  PrincipalPhoneNumber = '';

  CoordinatorCountryId: number | null = null;
  CoordinatorCountryName = '';
  CoordinatorCountryCode = '';
  CoordinatorPhoneNumber = '';

  countries: MasterCountryRequest[] = [];
  currencies: MasterCurrencyRequest[] = [];

  ngOnInit(): void {
    this.isCoordinatorMode = this.router.url.startsWith('/coordinator-school-registration');

    this.school.isDraft = true;
    this.school.accreditationStatus = 0; // Default to Pending / Draft status

    //this.school.schoolType = 515; // Default to Private
    //this.school.schoolStatus = 519; // Default to Draft

    this.getCountries();
    this.getCurrencies();
    this.getSchoolType();
    this.getSchoolStatus();
    this.getSchoolAccreditations();
    this.getSchoolTeachingLanguages();
  }

  // close all dropdowns on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select')) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns(): void {
    this.isSchoolTypeDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isPhoneCountryDropdownOpen = false;
    this.isPrincipalPhoneDropdownOpen = false;
    this.isCoordinatorPhoneDropdownOpen = false;
    this.isCurrencyDropdownOpen = false;
    this.isStatusDropdownOpen = false;
    this.isLanguageDropdownOpen = false;
    this.isAccreditationDropdownOpen = false;
    this.isIslamicDropdownOpen = false;
  }

  setActiveSection(section: number): void {
    this.activeSection = section;
  }

  toggleSection(section: number): void {
    if (this.activeSection === section) {
      this.activeSection = 0; // collapse it
    } else {
      this.activeSection = section;
    }
  }

  // School Type dropdown
  toggleSchoolTypeDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isSchoolTypeDropdownOpen;
    this.closeAllDropdowns();
    this.isSchoolTypeDropdownOpen = !current;
  }

  selectSchoolType(typeId: number): void {
    this.school.schoolType = typeId;
    this.isSchoolTypeDropdownOpen = false;
  }

  clearSchoolType(event: Event): void {
    event.stopPropagation();
    this.school.schoolType = 0;
  }

  getSchoolTypeName(): string {
    const selected = this.schoolType.find(t => t.uniqueId === this.school.schoolType);
    return selected ? selected.displayText : 'Select Type...';
  }

  getSelectedCountryName(): string {
    const selected = this.countries.find(c => c.countryId === this.school.countryId);
    return selected ? selected.countryName || 'Select Country...' : 'Select Country...';
  }

  // Country dropdown
  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isCountryDropdownOpen;
    this.closeAllDropdowns();
    this.isCountryDropdownOpen = !current;
  }

  selectCountry(countryId: number): void {
    this.school.countryId = countryId;
    this.isCountryDropdownOpen = false;

    const selectedC = this.countries.find(c => c.countryId === countryId);
    if (selectedC) {
      this.selectedIsdCode = selectedC.countryIsdCode?.toString() || '';

      this.PrincipalCountryId = selectedC.countryId || null;
      this.PrincipalCountryCode = selectedC.countryIsdCode?.toString() || '';

      this.CoordinatorCountryId = selectedC.countryId || null;
      this.CoordinatorCountryName = selectedC.countryName || '';
      this.CoordinatorCountryCode = selectedC.countryIsdCode?.toString() || '';
    }
  }

  clearCountry(event: Event): void {
    event.stopPropagation();
    this.school.countryId = 0;
    this.selectedIsdCode = '';
    this.PrincipalCountryId = null;
    this.PrincipalCountryCode = '';
    this.CoordinatorCountryId = null;
    this.CoordinatorCountryName = '';
    this.CoordinatorCountryCode = '';
  }

  // Phone Country Code dropdown
  togglePhoneCountryDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isPhoneCountryDropdownOpen;
    this.closeAllDropdowns();
    this.isPhoneCountryDropdownOpen = !current;
  }

  selectPhoneCountry(isdCode: string): void {
    this.selectedIsdCode = isdCode;
    this.isPhoneCountryDropdownOpen = false;
  }

  clearPhoneCountry(event: Event): void {
    event.stopPropagation();
    this.selectedIsdCode = '';
  }

  // Principal Phone dropdown
  togglePrincipalPhoneDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isPrincipalPhoneDropdownOpen;
    this.closeAllDropdowns();
    this.isPrincipalPhoneDropdownOpen = !current;
  }

  selectPrincipalPhoneCountry(c: MasterCountryRequest): void {
    this.PrincipalCountryId = c.countryId || null;
    this.PrincipalCountryCode = c.countryIsdCode?.toString() || '';
    this.isPrincipalPhoneDropdownOpen = false;
  }

  clearPrincipalPhone(event: Event): void {
    event.stopPropagation();
    this.PrincipalCountryId = null;
    this.PrincipalCountryCode = '';
  }

  // Coordinator Phone dropdown
  toggleCoordinatorPhoneDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isCoordinatorPhoneDropdownOpen;
    this.closeAllDropdowns();
    this.isCoordinatorPhoneDropdownOpen = !current;
  }

  selectCoordinatorPhoneCountry(c: MasterCountryRequest): void {
    this.CoordinatorCountryId = c.countryId || null;
    this.CoordinatorCountryName = c.countryName || '';
    this.CoordinatorCountryCode = c.countryIsdCode?.toString() || '';
    this.isCoordinatorPhoneDropdownOpen = false;
  }

  clearCoordinatorPhone(event: Event): void {
    event.stopPropagation();
    this.CoordinatorCountryId = null;
    this.CoordinatorCountryCode = '';
    this.CoordinatorCountryName = '';
  }

  // Currency dropdown
  toggleCurrencyDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isCurrencyDropdownOpen;
    this.closeAllDropdowns();
    this.isCurrencyDropdownOpen = !current;
  }

  selectCurrency(currencyId: number): void {
    this.school.defaultCurrencyId = currencyId;
    this.isCurrencyDropdownOpen = false;
  }

  clearCurrency(event: Event): void {
    event.stopPropagation();
    this.school.defaultCurrencyId = undefined;
  }

  getSelectedCurrencyName(): string {
    const selected = this.currencies.find(c => c.currencyId === this.school.defaultCurrencyId);
    return selected ? `${selected.currencySymbol} ${selected.currencyName} (${selected.currencyCode})` : 'Select Currency...';
  }

  // Status dropdown
  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isStatusDropdownOpen;
    this.closeAllDropdowns();
    this.isStatusDropdownOpen = !current;
  }

  selectSchoolStatus(statusId: number): void {
    this.school.schoolStatus = statusId;
    this.isStatusDropdownOpen = false;
  }

  clearSchoolStatus(event: Event): void {
    event.stopPropagation();
    this.school.schoolStatus = 0;
  }

  getSchoolStatusName(): string {
    const selected = this.schoolStatus.find(s => s.uniqueId === this.school.schoolStatus);
    return selected ? selected.displayText : 'Select Status...';
  }

  // Multi-select Teaching Languages
  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isLanguageDropdownOpen;
    this.closeAllDropdowns();
    this.isLanguageDropdownOpen = !current;
  }

  toggleLanguage(lang: string): void {
    let list = this.selectedLanguagesList;
    if (list.includes(lang)) {
      list = list.filter(l => l !== lang);
    } else {
      list.push(lang);
    }
    this.school.schoolTeachingLanguage = list.join(', ');
  }

  removeLanguage(lang: string): void {
    const list = this.selectedLanguagesList.filter(l => l !== lang);
    this.school.schoolTeachingLanguage = list.join(', ');
  }

  addCustomLanguage(): void {
    const lang = this.customLanguage.trim();
    if (lang) {
      const list = this.selectedLanguagesList;
      if (!list.includes(lang)) {
        list.push(lang);
        this.school.schoolTeachingLanguage = list.join(', ');
      }
      this.customLanguage = '';
    }
  }

  // Multi-select Accreditations
  toggleAccreditationDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isAccreditationDropdownOpen;
    this.closeAllDropdowns();
    this.isAccreditationDropdownOpen = !current;
  }

  toggleAccreditation(acc: string): void {
    let list = this.selectedAccreditationsList;
    if (list.includes(acc)) {
      list = list.filter(a => a !== acc);
    } else {
      list.push(acc);
    }
    this.school.schoolAccreditations = list.join(', ');
  }

  removeAccreditation(acc: string): void {
    const list = this.selectedAccreditationsList.filter(a => a !== acc);
    this.school.schoolAccreditations = list.join(', ');
  }

  addCustomAccreditation(): void {
    const acc = this.customAccreditation.trim();
    if (acc) {
      const list = this.selectedAccreditationsList;
      if (!list.includes(acc)) {
        list.push(acc);
        this.school.schoolAccreditations = list.join(', ');
      }
      this.customAccreditation = '';
    }
  }

  // Islamic Curriculum Toggle
  clearIslamicCurriculum(event: Event): void {
    event.stopPropagation();
    this.school.isIslamicCurriculum = undefined;
  }

  // Live preview for Student Code Format
  getStudentCodePreview(): string {
    const prefix = this.school.studentCodeFormatPrefix || 'SCH';
    const suffix = this.school.studentCodeFormatSuffix || 'A';
    const startingNo = this.school.studentSequenceNumber || 1;
    const formattedStartingNo = startingNo.toString().padStart(4, '0');
    return `${prefix}-${formattedStartingNo}-${suffix}`;
  }

  getCountries(): void {
    const filter = new MasterCountryFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;

    this.masterCountryService.getMasterCountries(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countries = response.result.items;

          if (!this.countries.length) {
            this.notification.warning(
              'No countries are available.'
            );
          }
          return;
        }
        this.countries = [];
      },
      error: (error) => {
        this.countries = [];
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  getCurrencies(): void {
    const filter = new MasterCurrencyFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;
    filter.isActive = true;

    this.masterCurrencyService.getMasterCurrencies(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.currencies = response.result.items;
          if (!this.currencies.length) {
            this.notification.warning(
              'No currencies are available.'
            );
          }
          return;
        }
        this.currencies = [];
      },
      error: (error) => {
        this.countries = [];
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  goToLogin(): void {
    if (this.isCoordinatorMode) {
      this.router.navigate([AppRoutes.School.CoordinatorSchoolAdd]);
    } else {
      this.router.navigate([AppRoutes.Common.Login]);
    }
  }

  saveDraft(): void {
    this.notification.success('Draft saved successfully.');
  }

  submitRegistration(form: NgForm): void {
    if (!form.valid) {
      this.notification.warning('Please fix validation errors.');
      return;
    }

    if (!this.school.countryId) {
      this.notification.warning('Please select a country');
      return;
    }

    if (!this.school.defaultCurrencyId) {
      this.notification.warning('Please select default currency');
      return;
    }

    // Phone numbers formatting
    if (this.selectedIsdCode && this.localPhoneNumber) {
      const prefix = this.selectedIsdCode.startsWith('+') ? this.selectedIsdCode : '+' + this.selectedIsdCode;
      this.school.schoolPhoneNo = `${prefix}${this.localPhoneNumber.replace(/\D/g, '')}`;
    }

    if (this.PrincipalCountryCode && this.PrincipalPhoneNumber) {
      const prefix = this.PrincipalCountryCode.startsWith('+') ? this.PrincipalCountryCode : '+' + this.PrincipalCountryCode;
      this.school.principalMobile = `${prefix}${this.PrincipalPhoneNumber.replace(/\D/g, '')}`;
    }

    if (this.CoordinatorCountryCode && this.CoordinatorPhoneNumber) {
      const prefix = this.CoordinatorCountryCode.startsWith('+') ? this.CoordinatorCountryCode : '+' + this.CoordinatorCountryCode;
      this.school.schoolCoordinatorMobile = `${prefix}${this.CoordinatorPhoneNumber.replace(/\D/g, '')}`;
    }

    this.school.isActive = true;
    this.school.isDraft = false;
    this.school.accreditationStatus = AccreditationStatus.Pending;

    this.masterSchoolService.addMasterSchool(this.school).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(response.message || 'School registered successfully.');
          this.goToLogin();
        } else {
          this.notification.error(response.message);
        }
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error?.error?.message ||
          error?.error?.Message ||
          error?.message ||
          'An error occurred during registration.';

        this.notification.error(message);
      }
    });
  }

  getPhoneCountryName(isdCode: string): string {
    const found = this.countries.find(c => c.countryIsdCode?.toString() === isdCode);
    return found ? `${found.countryName} (+${found.countryIsdCode})` : 'Select Code...';
  }

  getPrincipalPhoneCountryName(): string {
    const found = this.countries.find(c => c.countryId === this.PrincipalCountryId);
    return found ? `${found.countryName} (+${found.countryIsdCode})` : 'Select Code...';
  }

  getCoordinatorPhoneCountryName(): string {
    const found = this.countries.find(c => c.countryId === this.CoordinatorCountryId);
    return found ? `${found.countryName} (+${found.countryIsdCode})` : 'Select Code...';
  }


  schoolType: MasterDropDownRequest[] = [];
  schoolStatus: MasterDropDownRequest[] = [];
  schoolTeachingLanguages: MasterDropDownRequest[] = [];
  schoolAccreditations: MasterDropDownRequest[] = [];

  getSchoolType(): void {
    this.masterDropDownService.getByParentId(MainDropdown.SchoolType).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.schoolType = response.result;
          if (!this.schoolType.length) {
            this.notification.warning(
              'No school types are available.'
            );
          }

          return;
        }
        this.schoolType = [];
      },
      error: (error) => {
        this.schoolType = [];

        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  getSchoolStatus(): void {
    this.masterDropDownService.getByParentId(MainDropdown.SchoolStatus).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.schoolStatus = response.result;

          if (!this.schoolStatus.length) {
            this.notification.warning(
              'No school statuses are available.'
            );
          }
          return;
        }
        this.schoolStatus = [];
      },
      error: (error) => {
        this.schoolStatus = [];

        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  getSchoolTeachingLanguages(): void {
    this.masterDropDownService.getByParentId(MainDropdown.SchoolTeachingLanguages).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.schoolTeachingLanguages = response.result;

          if (!this.schoolTeachingLanguages.length) {
            this.notification.warning(
              'No teaching languages are available.'
            );
          }
          return;
        }
        this.schoolTeachingLanguages = [];
      },
      error: (error) => {
        this.schoolTeachingLanguages = [];

        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  getSchoolAccreditations(): void {
    this.masterDropDownService.getByParentId(MainDropdown.SchoolAccreditations).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.schoolAccreditations = response.result;

          if (!this.schoolAccreditations.length) {
            this.notification.warning(
              'No school accreditations are available.'
            );
          }
          return;
        }
        this.schoolAccreditations = [];
      },
      error: (error) => {
        this.schoolAccreditations = [];

        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

}
