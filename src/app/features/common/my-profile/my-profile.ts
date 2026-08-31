import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/common/auth.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';

import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { UsersLoginLogService } from '../../../core/services/superadmin/users-login-log.service';
import { UsersLoginLogFilter } from '../../../core/models/super-admin/users-login-logs/users-login-log-filter.model';
import { UsersLoginLogRequest } from '../../../core/models/super-admin/users-login-logs/users-login-log-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { UpdateMyProfile } from '../../../core/models/common/settings/update-my-profile-request.model';
import { CurrentUserProfile } from '../../../core/models/common/settings/current-user-profile.model';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/local-storage-keys';
import { ValidationPatterns } from '../../../core/constants/validation-patterns';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { PhoneValidatorDirective } from '../../../shared/directives/phone-validator.directive';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DisableAutocompleteDirective, PhoneValidatorDirective],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss',
})
export class MyProfile implements OnInit {
  private authService = inject(AuthService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private storageService = inject(StorageService);
  private notification = inject(NotificationService);
  private countryService = inject(MasterCountryService);
  private dropdownService = inject(MasterDropDownService);
  private usersLoginLogService = inject(UsersLoginLogService);
  private router = inject(Router);

  // Loading States
  isLoadingProfile = false;
  isSaving = false;
  isLoadingLogs = false;

  // View State
  showLogsView = false;

  // Master Data
  countries: MasterCountryRequest[] = [];
  salutations: string[] = [];

  // Dropdown UI Open States
  isSalutationDropdownOpen = false;
  isCountryDropdownOpen = false;
  isPhoneDropdownOpen = false;

  // Phone Inputs
  PhoneCountryId: number | null = null;
  PhoneCountryCode = '';
  PhoneNumber = '';

  // Form Data Models
  profile: CurrentUserProfile | null = null;
  model = new UpdateMyProfile();
  validationPatterns = ValidationPatterns;

  // Login Logs Data
  loginLogs: UsersLoginLogRequest[] = [];
  logFilter = new UsersLoginLogFilter();
  totalLogs = 0;

  get totalPages(): number {
    if (!this.logFilter.pageSize) return 1;
    return Math.ceil(this.totalLogs / this.logFilter.pageSize) || 1;
  }

  get isPreviousDisabled(): boolean {
    return this.logFilter.pageNumber <= 1;
  }

  get isNextDisabled(): boolean {
    return this.logFilter.pageNumber >= this.totalPages;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isSalutationDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  ngOnInit(): void {
    this.loadMasterDataAndProfile();
  }

  loadMasterDataAndProfile(): void {
    this.isLoadingProfile = true;

    this.loadCountries(() => {
      this.loadSalutations(() => {
        this.loadProfile();
      });
    });
  }

  loadCountries(callback?: () => void): void {
    const filter = new MasterCountryFilter();
    filter.pageNumber = 1;
    filter.pageSize = 1000;
    this.countryService.getMasterCountries(filter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.countries = res.result.items;
        }
        if (callback) callback();
      },
      error: (error) => {
        this.notification.handleBusinessError(error, 'Failed to load countries.');
        if (callback) callback();
      }
    });
  }

  loadSalutations(callback?: () => void): void {
    this.dropdownService.getByParentId(MainDropdown.Saluation).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.salutations = res.result.map(x => x.displayText);
        }
        if (callback) callback();
      },
      error: (error) => {
        this.notification.handleBusinessError(error, 'Failed to load salutations.');
        if (callback) callback();
      }
    });
  }

  loadProfile(): void {
    this.authService.getMyProfile().subscribe({
      next: (res) => {
        this.isLoadingProfile = false;
        if (res.success && res.result) {
          this.profile = res.result;
          this.profile.usernameOrLoginName = this.profile.loginName;
          this.mapProfileToModel(res.result);
        }
      },
      error: (error) => {
        this.isLoadingProfile = false;
        this.notification.handleBusinessError(error, 'Failed to load profile.');
      }
    });
  }

  mapProfileToModel(profile: CurrentUserProfile): void {
    this.model = new UpdateMyProfile();
    this.model.saluatation = profile.salutation || '';
    this.model.usernameOrLoginName = profile.usernameOrLoginName || '';
    this.model.firstName = profile.firstName || '';
    this.model.lastName = profile.lastName || '';
    this.model.personalEmail = profile.personalEmail || '';
    this.model.address = profile.address || '';
    this.model.city = profile.city || '';
    this.model.zip = profile.zip || '';

    // Map string country name or countryId
    this.model.countryId = profile.countryId || this.getCountryId(profile.country);

    // Split and parse mobile phone number
    this.parsePhone(profile.mobileNumber);
  }

  getCountryId(countryValue: string | undefined): number {
    if (!countryValue) return 0;
    // Check if it's already a number in string form
    const id = Number(countryValue);
    if (!isNaN(id) && id > 0) {
      return id;
    }
    // Otherwise look it up by name
    if (this.countries.length) {
      const match = this.countries.find(
        c => c.countryName.toLowerCase() === countryValue.toLowerCase()
      );
      if (match) return match.countryId || 0;
    }
    return 0;
  }

  // Split mobileNumber into PhoneCountryId, PhoneCountryCode and PhoneNumber
  parsePhone(phone?: string): void {
    if (!phone) {
      this.PhoneCountryId = null;
      this.PhoneCountryCode = '';
      this.PhoneNumber = '';
      return;
    }
    const matchingCountry = this.countries.find(c => {
      const code = '+' + c.countryIsdCode;
      return phone.startsWith(code);
    });

    if (matchingCountry) {
      this.PhoneCountryId = matchingCountry.countryId || null;
      this.PhoneCountryCode = matchingCountry.countryIsdCode?.toString() || '';
      const codeStr = '+' + this.PhoneCountryCode;
      this.PhoneNumber = phone.substring(codeStr.length);
    } else {
      this.PhoneNumber = phone;
    }
  }

  // Join PhoneCountryCode and PhoneNumber before saving
  applyPhoneBeforeSave(): void {
    if (this.PhoneCountryCode && this.PhoneNumber) {
      const prefix = this.PhoneCountryCode.startsWith('+') ? this.PhoneCountryCode : '+' + this.PhoneCountryCode;
      this.model.mobile = `${prefix}${this.PhoneNumber.replace(/\D/g, '')}`;
    } else {
      this.model.mobile = this.PhoneNumber || '';
    }
  }

  // Custom Dropdown Controls
  toggleSalutationDropdown(event: Event): void {
    event.stopPropagation();
    this.isSalutationDropdownOpen = !this.isSalutationDropdownOpen;
    this.isCountryDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  togglePhoneDropdown(event: Event): void {
    event.stopPropagation();
    this.isPhoneDropdownOpen = !this.isPhoneDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isCountryDropdownOpen = false;
  }

  selectSalutationOption(opt: string): void {
    this.model.saluatation = opt;
    this.isSalutationDropdownOpen = false;
  }

  selectCountryOption(countryId: number | undefined): void {
    this.model.countryId = countryId || 0;
    this.isCountryDropdownOpen = false;
  }

  selectPhoneCountry(c: MasterCountryRequest): void {
    this.PhoneCountryId = c.countryId || null;
    this.PhoneCountryCode = c.countryIsdCode?.toString() || '';
    this.isPhoneDropdownOpen = false;
  }

  getSelectedCountryName(): string {
    if (!this.model.countryId) return 'Select Country...';
    const c = this.countries.find(x => x.countryId === this.model.countryId);
    return c ? c.countryName : 'Select Country...';
  }

  getPhoneCountryName(): string {
    const found = this.countries.find(c => c.countryId === this.PhoneCountryId);
    return found ? `${found.countryName} (+${found.countryIsdCode})` : 'Select Code...';
  }

  updateProfile(): void {
    if (this.isSaving) return;

    // Apply mobile phone parsing/joining
    this.applyPhoneBeforeSave();

    this.isSaving = true;
    this.authService.updateMyProfile(this.model).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Profile updated successfully');
          this.syncCurrentUserProfile();
        } else {
          this.isSaving = false;
        }
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.handleBusinessError(error, 'Failed to update profile.');
      }
    });
  }

  syncCurrentUserProfile(): void {
    this.authService.getMyProfile().subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.result) {
          const profile = res.result;
          this.profile = profile;
          this.mapProfileToModel(profile);

          // Update current user storage & memory service context
          const sessionUser = sessionStorage.getItem(LOCAL_STORAGE_KEYS.USER.CURRENT_USER);
          if (sessionUser) {
            this.storageService.setCurrentUserSession(profile);
          } else {
            this.storageService.setCurrentUserPersistent(profile);
          }
          this.currentUserProfileService.setCurrentUserProfile(profile);
        }
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.handleBusinessError(error, 'Failed to sync profile after update.');
      }
    });
  }

  viewLogs(): void {
    this.showLogsView = true;
    this.logFilter.pageNumber = 1;
    this.logFilter.pageSize = 10;
    
    // Get loginId from profile. Note: CurrentUserProfile has loginId.
    if (this.profile && this.profile.loginId) {
        this.logFilter.loginId = this.profile.loginId;
    }
    this.loadLoginLogs();
  }

  hideLogs(): void {
    this.showLogsView = false;
  }

  loadLoginLogs(): void {
    this.isLoadingLogs = true;
    this.usersLoginLogService.getLoginLogs(this.logFilter).subscribe({
      next: (res) => {
        this.isLoadingLogs = false;
        if (res.success && res.result) {
          this.loginLogs = res.result.items;
          this.totalLogs = res.result.totalCount;
        }
      },
      error: (error) => {
        this.isLoadingLogs = false;
        this.notification.handleBusinessError(error, 'Failed to load login logs.');
      }
    });
  }

  previousPage(): void {
    if (!this.isPreviousDisabled) {
      this.logFilter.pageNumber--;
      this.loadLoginLogs();
    }
  }

  nextPage(): void {
    if (!this.isNextDisabled) {
      this.logFilter.pageNumber++;
      this.loadLoginLogs();
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
