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

@Component({
  selector: 'app-school-registration',
  imports: [CommonModule, FormsModule],
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

  selectedLanguages: string[] = [];
  customLanguage = '';

  selectedAccreditations: string[] = [];
  customAccreditation = '';

  // Islamic curriculum fields
  islamicCurriculumOffered = 'No';
  religionSubjectCurriculum = '';

  // Quality indicator check states
  successAbove80 = false;
  eligibleAbove80 = false;
  englishAbove80 = false;

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
    if (this.selectedLanguages.includes(lang)) {
      this.selectedLanguages = this.selectedLanguages.filter(l => l !== lang);
    } else {
      this.selectedLanguages.push(lang);
    }
    this.school.schoolTeachingLanguage = this.selectedLanguages.join(', ');
  }

  removeLanguage(lang: string): void {
    this.selectedLanguages = this.selectedLanguages.filter(l => l !== lang);
    this.school.schoolTeachingLanguage = this.selectedLanguages.join(', ');
  }

  addCustomLanguage(): void {
    const lang = this.customLanguage.trim();
    if (lang) {
      if (!this.selectedLanguages.includes(lang)) {
        this.selectedLanguages.push(lang);
        this.school.schoolTeachingLanguage = this.selectedLanguages.join(', ');
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
    if (this.selectedAccreditations.includes(acc)) {
      this.selectedAccreditations = this.selectedAccreditations.filter(a => a !== acc);
    } else {
      this.selectedAccreditations.push(acc);
    }
    this.school.schoolAccreditations = this.selectedAccreditations.join(', ');
  }

  removeAccreditation(acc: string): void {
    this.selectedAccreditations = this.selectedAccreditations.filter(a => a !== acc);
    this.school.schoolAccreditations = this.selectedAccreditations.join(', ');
  }

  addCustomAccreditation(): void {
    const acc = this.customAccreditation.trim();
    if (acc) {
      if (!this.selectedAccreditations.includes(acc)) {
        this.selectedAccreditations.push(acc);
        this.school.schoolAccreditations = this.selectedAccreditations.join(', ');
      }
      this.customAccreditation = '';
    }
  }

  // Islamic Curriculum Toggle
  clearIslamicCurriculum(event: Event): void {
    event.stopPropagation();
    this.islamicCurriculumOffered = '';
    this.school.isIslamicCurriculum = false;
    this.updateSubjectCurriculum();
  }

  onIslamicCurriculumChange(val: string): void {
    this.islamicCurriculumOffered = val;
    this.school.isIslamicCurriculum = (val === 'Yes');
    this.updateSubjectCurriculum();
  }

  onReligionCurriculumChange(val: string): void {
    this.religionSubjectCurriculum = val;
    this.updateSubjectCurriculum();
  }

  updateSubjectCurriculum(): void {
    this.school.religionSubjectCurriculum = `${this.islamicCurriculumOffered} | ${this.religionSubjectCurriculum}`;
  }

  // Quality indicator checkboxes
  onSuccessToggle(val: boolean): void {
    this.successAbove80 = val;
    this.school.isThreeYearStudentSuccessRateAbove80 = val;
  }

  onEligibleToggle(val: boolean): void {
    this.eligibleAbove80 = val;
    this.school.isUniversityEligibilityRateAbove80 = val;
  }

  onEnglishToggle(val: boolean): void {
    this.englishAbove80 = val;
    this.school.isGraduateEnglishProficiencyAbove80 = val;
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
    filter.isActive = true;

    this.masterCountryService.getMasterCountries(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countries = response.result.items;
        } else {
          this.notification.warning(response.message);
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
        } else {
          this.notification.warning(response.message);
        }
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

    this.masterSchoolService.addMasterSchool(this.school).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(response.message || 'School registered successfully.');
          this.goToLogin();
        } else {
          this.notification.error(response.message);
        }
      },
      error: (err) => {
        this.notification.error(err.message || 'An error occurred during registration.');
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
    this.masterDropDownService
      .getByParentId(MainDropdown.SchoolType)
      .subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.schoolType = response.result;
          } else {
            this.notification.warning(response.message);
          }
        }
      });
  }

  getSchoolStatus(): void {
    this.masterDropDownService
      .getByParentId(MainDropdown.SchoolStatus)
      .subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.schoolStatus = response.result;
          } else {
            this.notification.warning(response.message);
          }
        }
      });
  }

  getSchoolTeachingLanguages(): void {
    this.masterDropDownService
      .getByParentId(MainDropdown.SchoolTeachingLanguages)
      .subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.schoolTeachingLanguages = response.result;
          } else {
            this.notification.warning(response.message);
          }
        }
      });
  }

  getSchoolAccreditations(): void {
    this.masterDropDownService
      .getByParentId(MainDropdown.SchoolAccreditations)
      .subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.schoolAccreditations = response.result;
          } else {
            this.notification.warning(response.message);
          }
        }
      });
  }

}
