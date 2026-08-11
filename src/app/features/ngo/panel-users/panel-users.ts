import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { PanelUserService } from '../../../core/services/ngo/panel-users.service';
import { PanelUserRequestModel } from '../../../core/models/ngo/panel-users/panel-user-request.model';
import { PanelUserFilterModel } from '../../../core/models/ngo/panel-users/panel-user-filter.dto';
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

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-panel-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './panel-users.html',
  styleUrl: './panel-users.scss',
})
export class PanelUsers implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isRoleFilterDropdownOpen = false;
    this.isStatusFilterDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  private panelUserService = inject(PanelUserService);
  private masterDropdownService = inject(MasterDropDownService);
  private countryService = inject(MasterCountryService);
  private masterUsersRoleService = inject(MasterUsersRoleService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table
  users: PanelUserRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiTotal = 0;
  kpiActive = 0;
  kpiCommittee = 0;
  kpiFinance = 0;
  kpiMarketing = 0;

  // Filter
  filter = new PanelUserFilterModel();

  // Roles List
  roles: UsersRoleLookupModel[] = [];

  selectedRoleFilter: string = 'all';
  selectedStatusFilter: string = 'all';

  isPageSizeDropdownOpen = false;
  isRoleFilterDropdownOpen = false;
  isStatusFilterDropdownOpen = false;

  // Custom Dropdown States
  isSalutationDropdownOpen = false;
  isGenderDropdownOpen = false;
  isRoleDropdownOpen = false;
  isPhoneDropdownOpen = false;

  // saluatation and gender
  salutations: string[] = [];
  genders: MasterDropDownRequest[] = [];
  countries: MasterCountryRequest[] = [];

  // Phone input states
  PhoneCountryId: number | null = null;
  PhoneCountryCode = '';
  PhoneNumber = '';

  // Modal Dialogs
  showUserModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempUserModel = new PanelUserRequestModel();
  userToDelete?: PanelUserRequestModel;

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
        StaffType.Ngo,
        StaffType.Marketing,
        StaffType.Finance
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
    this.panelUserService.getPanelUsers(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.users = response.result.items;
          this.totalRecords = response.result.totalCount;
          this.calculateKPIs(this.users);
        } else {
          this.users = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.users = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load panel users.');
      }
    });
  }

  calculateKPIs(items: PanelUserRequestModel[]): void {
    // Total is based on backend pagination total count
    this.kpiTotal = this.totalRecords;
    
    // Active / Role KPI counts are calculated from the current page's list of items
    this.kpiActive = items.filter(x => x.isActive).length;
    this.kpiCommittee = items.filter(x => x.roleId === 2).length;
    this.kpiMarketing = items.filter(x => x.roleId === 5).length;
    this.kpiFinance = items.filter(x => x.roleId === 6).length;
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
    this.isStatusFilterDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectRoleFilterOption(roleIdOrAll: number | string): void {
    this.selectedRoleFilter = roleIdOrAll.toString();
    this.isRoleFilterDropdownOpen = false;
    if (this.selectedRoleFilter === 'all') {
      this.filter.roleId = undefined;
      this.filter.staffType = undefined;
    } else {
      const id = Number(this.selectedRoleFilter);
      this.filter.roleId = id;
      const selectedRole = this.roles.find(r => r.roleId === id);
      this.filter.staffType = selectedRole ? selectedRole.moduleId : undefined;
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

  toggleStatusFilterDropdown(event: Event): void {
    event.stopPropagation();
    this.isStatusFilterDropdownOpen = !this.isStatusFilterDropdownOpen;
    this.isRoleFilterDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectStatusFilterOption(status: string): void {
    this.selectedStatusFilter = status;
    this.isStatusFilterDropdownOpen = false;
    if (this.selectedStatusFilter === 'all') {
      this.filter.isActive = undefined;
    } else if (this.selectedStatusFilter === 'active') {
      this.filter.isActive = true;
    } else if (this.selectedStatusFilter === 'disabled') {
      this.filter.isActive = false;
    }
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedStatusFilterName(): string {
    if (this.selectedStatusFilter === 'active') {
      return 'Active';
    }
    if (this.selectedStatusFilter === 'disabled') {
      return 'Disabled';
    }
    return 'All statuses';
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
    this.tempUserModel = new PanelUserRequestModel();
    this.tempUserModel.staffId = undefined;
    this.tempUserModel.staffType = 0;
    this.tempUserModel.roleId = 0;
    this.tempUserModel.gender = null;
    this.tempUserModel.staffSalutation = '';
    this.tempUserModel.isActive = true;
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.PhoneCountryId = null;
    this.PhoneCountryCode = '';
    this.PhoneNumber = '';
    this.showUserModal = true;
  }

  openEditUserModal(user: PanelUserRequestModel): void {
    this.tempUserModel = { ...user };
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.parsePhone(this.tempUserModel.mobileNumber);
    this.showUserModal = true;
  }

  toggleSalutationDropdown(event: Event): void {
    event.stopPropagation();
    this.isSalutationDropdownOpen = !this.isSalutationDropdownOpen;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
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
  }

  selectGenderOption(uniqueId: number | null): void {
    this.tempUserModel.gender = uniqueId;
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

  togglePhoneDropdown(event: Event): void {
    event.stopPropagation();
    this.isPhoneDropdownOpen = !this.isPhoneDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
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
    if (form.invalid || !this.tempUserModel.roleId || this.tempUserModel.roleId === 0) {
      form.control.markAllAsTouched();
      return;
    }

    this.applyPhoneBeforeSave();
    this.tempUserModel.recoveryEmail = this.tempUserModel.officialEmail ? this.tempUserModel.officialEmail.trim().toLowerCase() : '';
    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempUserModel.staffId
      ? this.panelUserService.updatePanelUser(this.tempUserModel)
      : this.panelUserService.addPanelUser(this.tempUserModel);

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
          this.modalErrorMessage = 'An error occurred while saving the user.';
        }
      }
    });
  }

  // --- Delete User Modal ---
  openDeleteUserModal(user: PanelUserRequestModel): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete?.staffId) {
      return;
    }

    this.panelUserService.deletePanelUser(this.userToDelete.staffId).subscribe({
      next: () => {
        this.notification.success('Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting user.');
      }
    });
  }

}
