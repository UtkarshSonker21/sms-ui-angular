import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { StaffService } from '../../../core/services/superadmin/staff.service';
import { StaffRequestModel } from '../../../core/models/super-admin/staff/staff-request.model';
import { StaffFilterModel } from '../../../core/models/super-admin/staff/staff-filter.model';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { StaffType } from '../../../core/enums/staff-type.enum';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { ValidationPatterns } from '../../../core/constants/validation-patterns';
import { PhoneValidatorDirective } from '../../../shared/directives/phone-validator.directive';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective, PhoneValidatorDirective],
  templateUrl: './staff.html',
  styleUrl: './staff.scss',
})
export class Staff implements OnInit {

  validationPatterns = ValidationPatterns;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isStaffTypeDropdownOpen = false;
    this.isStaffTypeFilterDropdownOpen = false;
    this.isCountryFilterDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  private staffService = inject(StaffService);
  private masterDropdownService = inject(MasterDropDownService);
  private countryService = inject(MasterCountryService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table
  staffs: StaffRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new StaffFilterModel();

  selectedStaffTypeFilter: string = 'all';
  selectedCountryFilter: string = 'all';

  isPageSizeDropdownOpen = false;
  isStaffTypeFilterDropdownOpen = false;
  isCountryFilterDropdownOpen = false;

  // Custom Dropdown States
  isSalutationDropdownOpen = false;
  isGenderDropdownOpen = false;
  isCountryDropdownOpen = false;
  isStaffTypeDropdownOpen = false;
  isPhoneDropdownOpen = false;

  // Master Lists
  salutations: string[] = [];
  genders: MasterDropDownRequest[] = [];
  countries: MasterCountryRequest[] = [];

  // Staff Types Lookup
  staffTypes = [
    { value: StaffType.SuperAdmin, label: 'Super Admin' },
    { value: StaffType.Ngo, label: 'NGO' },
    { value: StaffType.School, label: 'School' },
    { value: StaffType.University, label: 'University' },
    { value: StaffType.Marketing, label: 'Marketing' },
    { value: StaffType.Finance, label: 'Finance' },
  ];

  // Phone input states
  PhoneCountryId: number | null = null;
  PhoneCountryCode = '';
  PhoneNumber = '';

  // Modal Dialogs
  showUserModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempStaffModel = new StaffRequestModel();
  staffToDelete?: StaffRequestModel;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
    this.loadGenders();
    this.loadSalutations();
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
        }
      }
    });
  }

  loadGenders(): void {
    this.masterDropdownService.getByParentId(MainDropdown.Gender).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.genders = response.result;
        }
      }
    });
  }

  loadSalutations(): void {
    this.masterDropdownService.getByParentId(MainDropdown.Saluation).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.salutations = response.result.map(x => x.displayText);
        }
      }
    });
  }

  loadData(): void {
    this.staffService.getStaffs(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.staffs = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.staffs = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.staffs = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load staff records.');
      }
    });
  }

  // --- Search & Filtering ---
  applySearch(): void {
    this.filter.searchText = this.searchText.trim() || undefined;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSearch(): void {
    this.searchText = '';
    this.filter.searchText = undefined;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applySearch();
    }
  }

  toggleStaffTypeFilterDropdown(event: Event): void {
    event.stopPropagation();
    this.isStaffTypeFilterDropdownOpen = !this.isStaffTypeFilterDropdownOpen;
    this.isCountryFilterDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectStaffTypeFilterOption(value: string | number): void {
    this.selectedStaffTypeFilter = value.toString();
    this.isStaffTypeFilterDropdownOpen = false;
    if (this.selectedStaffTypeFilter === 'all') {
      this.filter.staffType = undefined;
    } else {
      this.filter.staffType = Number(this.selectedStaffTypeFilter);
    }
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedStaffTypeFilterName(): string {
    if (this.selectedStaffTypeFilter === 'all') {
      return 'All staff types';
    }
    const type = this.staffTypes.find(x => x.value === Number(this.selectedStaffTypeFilter));
    return type ? type.label : 'All staff types';
  }

  toggleCountryFilterDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountryFilterDropdownOpen = !this.isCountryFilterDropdownOpen;
    this.isStaffTypeFilterDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectCountryFilterOption(value: string | number): void {
    this.selectedCountryFilter = value.toString();
    this.isCountryFilterDropdownOpen = false;
    if (this.selectedCountryFilter === 'all') {
      this.filter.countryId = undefined;
    } else {
      this.filter.countryId = Number(this.selectedCountryFilter);
    }
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedCountryFilterName(): string {
    if (this.selectedCountryFilter === 'all') {
      return 'All countries';
    }
    const country = this.countries.find(x => x.countryId === Number(this.selectedCountryFilter));
    return country ? country.countryName || '' : 'All countries';
  }



  // --- Page Size Dropdown ---
  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
  }

  selectPageSize(size: number): void {
    this.isPageSizeDropdownOpen = false;
    this.filter.pageSize = size;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  previousPage(): void {
    if (this.filter.pageNumber > 1) {
      this.filter.pageNumber--;
      this.loadData();
    }
  }

  nextPage(): void {
    if (this.filter.pageNumber < this.totalPages) {
      this.filter.pageNumber++;
      this.loadData();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / (this.filter.pageSize || 25)) || 1;
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber === 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }

  // --- Add / Edit Staff Modal ---
  openAddStaffModal(): void {
    this.tempStaffModel = new StaffRequestModel();
    this.tempStaffModel.staffId = undefined;
    this.tempStaffModel.staffType = 0;
    this.tempStaffModel.gender = 0;
    this.tempStaffModel.staffSalutation = '';
    this.tempStaffModel.isActive = true;
    this.tempStaffModel.universityIds = [];
    this.tempStaffModel.schoolIds = [];
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isStaffTypeDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.PhoneCountryId = null;
    this.PhoneCountryCode = '';
    this.PhoneNumber = '';
    this.showUserModal = true;
  }

  openEditStaffModal(staff: StaffRequestModel): void {
    if (!staff.staffId) return;
    this.staffService.getStaffById(staff.staffId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempStaffModel = { ...response.result };
          this.tempStaffModel.universityIds = this.tempStaffModel.universityIds || [];
          this.tempStaffModel.schoolIds = this.tempStaffModel.schoolIds || [];
          this.modalErrorMessage = '';
          this.isSalutationDropdownOpen = false;
          this.isGenderDropdownOpen = false;
          this.isCountryDropdownOpen = false;
          this.isStaffTypeDropdownOpen = false;
          this.isPhoneDropdownOpen = false;
          this.parsePhone(this.tempStaffModel.mobileNumber);
          this.showUserModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load staff details.');
        }
      },
      error: () => {
        this.notification.error('Failed to load staff details.');
      }
    });
  }

  toggleSalutationDropdown(event: Event): void {
    event.stopPropagation();
    this.isSalutationDropdownOpen = !this.isSalutationDropdownOpen;
    this.isGenderDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isStaffTypeDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  selectSalutationOption(option: string): void {
    this.tempStaffModel.staffSalutation = option;
    this.isSalutationDropdownOpen = false;
  }

  toggleGenderDropdown(event: Event): void {
    event.stopPropagation();
    this.isGenderDropdownOpen = !this.isGenderDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isStaffTypeDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  selectGenderOption(uniqueId: number): void {
    this.tempStaffModel.gender = uniqueId;
    this.isGenderDropdownOpen = false;
  }

  getSelectedGenderName(): string {
    const genderId = this.tempStaffModel.gender;
    if (!genderId) return 'Select...';
    const g = this.genders.find(x => x.uniqueId === genderId);
    return g ? g.displayText : 'Select...';
  }

  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isStaffTypeDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  selectCountryOption(countryId: number | undefined): void {
    this.tempStaffModel.permCountryId = countryId;
    this.isCountryDropdownOpen = false;
  }

  getSelectedCountryName(): string {
    const countryId = this.tempStaffModel.permCountryId;
    if (!countryId) return 'Select Country...';
    const country = this.countries.find(x => x.countryId === countryId);
    return country ? country.countryName || '' : 'Select Country...';
  }

  toggleStaffTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.isStaffTypeDropdownOpen = !this.isStaffTypeDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  selectStaffTypeOption(val: number): void {
    this.tempStaffModel.staffType = val;
    this.isStaffTypeDropdownOpen = false;
  }

  getSelectedStaffTypeName(): string {
    const type = this.staffTypes.find(x => x.value === this.tempStaffModel.staffType);
    return type ? type.label : 'Select Staff Type...';
  }

  togglePhoneDropdown(event: Event): void {
    event.stopPropagation();
    this.isPhoneDropdownOpen = !this.isPhoneDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isCountryDropdownOpen = false;
    this.isStaffTypeDropdownOpen = false;
  }

  selectPhoneCountry(c: MasterCountryRequest): void {
    this.PhoneCountryId = c.countryId || null;
    this.PhoneCountryCode = c.countryIsdCode?.toString() || '';
    this.isPhoneDropdownOpen = false;
  }

  getPhoneCountryName(): string {
    const found = this.countries.find(c => c.countryId === this.PhoneCountryId);
    return found ? `+${found.countryIsdCode}` : 'Select Code...';
  }

  parsePhone(phone?: string): void {
    if (!phone) {
      this.PhoneCountryId = null;
      this.PhoneCountryCode = '';
      this.PhoneNumber = '';
      return;
    }
    const matchingCountry = this.countries.find(c => {
      if (!c.countryIsdCode) return false;
      const code = '+' + c.countryIsdCode;
      return phone.startsWith(code);
    });

    if (matchingCountry) {
      this.PhoneCountryId = matchingCountry.countryId || null;
      this.PhoneCountryCode = matchingCountry.countryIsdCode?.toString() || '';
      const codeStr = '+' + this.PhoneCountryCode;
      this.PhoneNumber = phone.substring(codeStr.length);
    } else {
      this.PhoneCountryId = null;
      this.PhoneCountryCode = '';
      this.PhoneNumber = phone;
    }
  }

  applyPhoneBeforeSave(): void {
    if (this.PhoneCountryCode && this.PhoneNumber) {
      const prefix = this.PhoneCountryCode.startsWith('+') ? this.PhoneCountryCode : '+' + this.PhoneCountryCode;
      this.tempStaffModel.mobileNumber = `${prefix}${this.PhoneNumber.replace(/\D/g, '')}`;
    } else {
      this.tempStaffModel.mobileNumber = this.PhoneNumber || '';
    }
  }



  getStaffTypeDisplayName(typeNum: number): string {
    const matched = this.staffTypes.find(x => x.value === typeNum);
    return matched ? matched.label : '-';
  }

  saveStaff(form: NgForm): void {
    if (form.invalid || !this.tempStaffModel.staffType || this.tempStaffModel.staffType === 0) {
      form.control.markAllAsTouched();
      return;
    }

    this.applyPhoneBeforeSave();
    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempStaffModel.staffId
      ? this.staffService.updateStaff(this.tempStaffModel)
      : this.staffService.addStaff(this.tempStaffModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempStaffModel.staffId ? 'Staff Updated Successfully' : 'Staff Created Successfully');
        this.showUserModal = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the staff member.';
        }
      }
    });
  }

  // --- Delete Staff Modal ---
  openDeleteStaffModal(staff: StaffRequestModel): void {
    this.staffToDelete = staff;
    this.showDeleteModal = true;
  }

  confirmDeleteStaff(): void {
    if (!this.staffToDelete?.staffId) {
      return;
    }

    this.staffService.deleteStaff(this.staffToDelete.staffId).subscribe({
      next: () => {
        this.notification.success('Staff Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting staff member.');
      }
    });
  }

}

