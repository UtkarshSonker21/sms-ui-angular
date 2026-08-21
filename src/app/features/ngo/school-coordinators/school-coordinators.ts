import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { SchoolCoordinatorService } from '../../../core/services/ngo/school-coordinator.service';
import { SchoolCoordinatorRequestModel } from '../../../core/models/ngo/school-coordinators/school-coordinator-request.model';
import { SchoolCoordinatorFilterModel } from '../../../core/models/ngo/school-coordinators/school-coordinator-filter.model';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterUsersRoleService } from '../../../core/services/superadmin/master-users-roles.service';
import { UsersRoleLookupModel } from '../../../core/models/super-admin/users-role/users-role-lookup.model';
import { UsersRoleByModulesRequestModel } from '../../../core/models/super-admin/users-role/users-role-by-modules-request.model';
import { StaffType } from '../../../core/enums/staff-type.enum';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { SchoolByCountryRequest } from '../../../core/models/school/master-school/school-by-country-request.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { ValidationPatterns } from '../../../core/constants/validation-patterns';
import { PhoneValidatorDirective } from '../../../shared/directives/phone-validator.directive';

@Component({
  selector: 'app-school-coordinators',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective, PhoneValidatorDirective],
  templateUrl: './school-coordinators.html',
  styleUrl: './school-coordinators.scss',
})
export class SchoolCoordinators implements OnInit {

  validationPatterns = ValidationPatterns;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isRoleFilterDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isCountriesDropdownOpen = false;
  }

  private coordinatorService = inject(SchoolCoordinatorService);
  private masterDropdownService = inject(MasterDropDownService);
  private countryService = inject(MasterCountryService);
  private masterUsersRoleService = inject(MasterUsersRoleService);
  private schoolService = inject(MasterSchoolService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table
  users: SchoolCoordinatorRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiTotal = 0;
  kpiActive = 0;

  // Filter
  filter = new SchoolCoordinatorFilterModel();

  // Roles List
  roles: UsersRoleLookupModel[] = [];

  selectedRoleFilter: string = 'all';

  isPageSizeDropdownOpen = false;
  isRoleFilterDropdownOpen = false;

  // Custom Dropdown States
  isSalutationDropdownOpen = false;
  isGenderDropdownOpen = false;
  isRoleDropdownOpen = false;
  isPhoneDropdownOpen = false;
  isCountriesDropdownOpen = false;

  // saluatation and gender
  salutations: string[] = [];
  genders: MasterDropDownRequest[] = [];
  countries: MasterCountryRequest[] = []; // Used for both phone and countries mapping

  // Phone input states
  PhoneCountryId: number | null = null;
  PhoneCountryCode = '';
  PhoneNumber = '';

  // Countries mapping state
  selectedCountryIds: number[] = [];


  // Modal Dialogs
  showUserModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempUserModel = new SchoolCoordinatorRequestModel();
  userToDelete?: SchoolCoordinatorRequestModel;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
    this.loadGenders();
    this.loadSalutations();
    this.loadCountries();
    this.loadRoles();
  }

  loadRoles(): void {
    const request: UsersRoleByModulesRequestModel = {
      moduleIds: [
        StaffType.School,
      ]
    };
    this.masterUsersRoleService.getUsersRolesByModules(request).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.roles = response.result;
        }
      }
    });
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
    this.coordinatorService.getSchoolCoordinators(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.users = response.result.items;
          this.totalRecords = response.result.totalCount;
          this.calculateKPIs();
        } else {
          this.users = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.users = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load school coordinators.');
      }
    });
  }

  calculateKPIs(): void {
    this.kpiTotal = this.totalRecords;
    this.kpiActive = this.users.length;
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

  toggleRoleFilterDropdown(event: Event): void {
    event.stopPropagation();
    this.isRoleFilterDropdownOpen = !this.isRoleFilterDropdownOpen;
    this.isPageSizeDropdownOpen = false;
  }

  selectRoleFilterOption(roleIdOrAll: number | string): void {
    this.selectedRoleFilter = roleIdOrAll.toString();
    this.isRoleFilterDropdownOpen = false;
    if (this.selectedRoleFilter === 'all') {
      this.filter.roleId = undefined;
    } else {
      const id = Number(this.selectedRoleFilter);
      this.filter.roleId = id;
    }
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedRoleFilterName(): string {
    if (this.selectedRoleFilter === 'all') {
      return 'All roles';
    }
    const role = this.roles.find(x => x.roleId === Number(this.selectedRoleFilter));
    return role ? role.roleName || '' : 'All roles';
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

  // --- Add / Edit User Modal ---
  openAddUserModal(): void {
    this.tempUserModel = new SchoolCoordinatorRequestModel();
    this.tempUserModel.staffId = undefined;
    this.tempUserModel.staffType = 0;
    this.tempUserModel.roleId = 0;
    this.tempUserModel.gender = 0;
    this.tempUserModel.staffSalutation = '';
    this.tempUserModel.schoolIds = [];
    (this.tempUserModel as any).isActive = true;
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isCountriesDropdownOpen = false;
    this.PhoneCountryId = null;
    this.PhoneCountryCode = '';
    this.PhoneNumber = '';
    this.selectedCountryIds = [];
    this.showUserModal = true;
  }

  openEditUserModal(user: SchoolCoordinatorRequestModel): void {
    this.tempUserModel = { ...user };
    if (!this.tempUserModel.schoolIds) {
      this.tempUserModel.schoolIds = [];
    }
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isCountriesDropdownOpen = false;
    this.selectedCountryIds = [];
    this.parsePhone(this.tempUserModel.mobileNumber);
    
    if (user.staffId) {
      this.coordinatorService.getSchoolCoordinatorById(user.staffId).subscribe({
        next: (res) => {
          if (res.success && res.result) {
            this.tempUserModel = res.result;
            if (!this.tempUserModel.schoolIds) {
              this.tempUserModel.schoolIds = [];
            }
            if ((this.tempUserModel as any).countryIds) {
              this.selectedCountryIds = [...(this.tempUserModel as any).countryIds];
            } else {
              this.selectedCountryIds = [];
            }
            this.parsePhone(this.tempUserModel.mobileNumber);
          }
        }
      });
    }

    this.showUserModal = true;
  }

  toggleSalutationDropdown(event: Event): void {
    event.stopPropagation();
    this.isSalutationDropdownOpen = !this.isSalutationDropdownOpen;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isCountriesDropdownOpen = false;
  }

  selectSalutationOption(option: string): void {
    this.tempUserModel.staffSalutation = option;
    this.isSalutationDropdownOpen = false;
  }

  toggleGenderDropdown(event: Event): void {
    event.stopPropagation();
    this.isGenderDropdownOpen = !this.isGenderDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isCountriesDropdownOpen = false;
  }

  selectGenderOption(uniqueId: number | null): void {
    this.tempUserModel.gender = uniqueId ?? 0;
    this.isGenderDropdownOpen = false;
  }

  getSelectedGenderName(): string {
    const genderId = this.tempUserModel.gender;
    if (!genderId) return 'Select...';
    const g = this.genders.find(x => x.uniqueId === genderId);
    return g ? g.displayText : 'Select...';
  }

  toggleRoleDropdown(event: Event): void {
    event.stopPropagation();
    this.isRoleDropdownOpen = !this.isRoleDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isCountriesDropdownOpen = false;
  }

  selectRoleOption(roleId: number): void {
    const selectedRole = this.roles.find(r => r.roleId === roleId);
    if (selectedRole) {
      this.tempUserModel.roleId = selectedRole.roleId;
      this.tempUserModel.staffType = selectedRole.moduleId;
    } else {
      this.tempUserModel.roleId = 0;
      this.tempUserModel.staffType = 0;
    }
    this.isRoleDropdownOpen = false;
  }

  getSelectedRoleName(): string {
    const r = this.roles.find(x => x.roleId === this.tempUserModel.roleId);
    return r ? r.roleName || '' : '';
  }

  // --- Countries Multiselect ---
  toggleCountriesDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountriesDropdownOpen = !this.isCountriesDropdownOpen;
    this.isRoleDropdownOpen = false;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  isCountrySelected(id: number): boolean {
    return this.selectedCountryIds.includes(id);
  }

  toggleCountry(id: number): void {
    if (this.isCountrySelected(id)) {
      this.selectedCountryIds = this.selectedCountryIds.filter(x => x !== id);
    } else {
      this.selectedCountryIds.push(id);
    }
  }

  removeCountry(id: number): void {
    this.selectedCountryIds = this.selectedCountryIds.filter(x => x !== id);
  }

  getCountryName(id: number): string {
    const country = this.countries.find(x => x.countryId === id);
    return country ? country.countryName || '' : 'Unknown';
  }

  // --- Phone ---
  togglePhoneDropdown(event: Event): void {
    event.stopPropagation();
    this.isPhoneDropdownOpen = !this.isPhoneDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isCountriesDropdownOpen = false;
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
      this.tempUserModel.mobileNumber = `${prefix}${this.PhoneNumber.replace(/\D/g, '')}`;
    } else {
      this.tempUserModel.mobileNumber = this.PhoneNumber || '';
    }
  }

  saveUser(form: NgForm): void {
    if (form.invalid || !this.tempUserModel.roleId || this.tempUserModel.roleId === 0 || this.selectedCountryIds.length === 0) {
      form.control.markAllAsTouched();
      return;
    }

    this.applyPhoneBeforeSave();
    this.applyPhoneBeforeSave();this.tempUserModel.recoveryEmail = this.tempUserModel.officialEmail ? this.tempUserModel.officialEmail.trim().toLowerCase() : '';
    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.selectedCountryIds.length > 0) {
      const schoolReq: SchoolByCountryRequest = {
        countryIds: this.selectedCountryIds
      };
      this.schoolService.getSchoolsByCountryIds(schoolReq).subscribe({
        next: (res) => {
          if (res.success && res.result) {
            this.tempUserModel.schoolIds = res.result.map(s => s.schoolId!);
            this.executeSave();
          } else {
            this.isSaving = false;
            this.modalErrorMessage = res.message || 'Failed to fetch schools for selected countries.';
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.modalErrorMessage = 'Failed to fetch schools for selected countries.';
        }
      });
    } else {
       // Proceed with existing schoolIds if editing and no countries selected (for now)
       this.executeSave();
    }
  }

  private executeSave(): void {
    const request = this.tempUserModel.staffId
      ? this.coordinatorService.updateSchoolCoordinator(this.tempUserModel)
      : this.coordinatorService.addSchoolCoordinator(this.tempUserModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempUserModel.staffId ? 'Updated Successfully' : 'Created Successfully');
        this.showUserModal = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the coordinator.';
        }
      }
    });
  }

  // --- Delete User Modal ---
  openDeleteUserModal(user: SchoolCoordinatorRequestModel): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete?.staffId) {
      return;
    }

    this.coordinatorService.deleteSchoolCoordinator(this.userToDelete.staffId).subscribe({
      next: () => {
        this.notification.success('Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting coordinator.');
      }
    });
  }

}
