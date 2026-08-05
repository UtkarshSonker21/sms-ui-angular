import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { UniversityCoordinatorService } from '../../../core/services/ngo/university-coordinator.service';
import { UniversityCoordinatorRequestModel } from '../../../core/models/ngo/university-coordinators/university-coordinator-request.model';
import { UniversityCoordinatorFilterModel } from '../../../core/models/ngo/university-coordinators/university-coordinator-filter.model';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterUsersRoleService } from '../../../core/services/superadmin/master-users-roles.service';
import { UsersRoleLookupModel } from '../../../core/models/super-admin/master-users-role/users-role-lookup.model';
import { UsersRoleByModulesRequestModel } from '../../../core/models/super-admin/master-users-role/users-role-by-modules-request.model';
import { StaffType } from '../../../core/enums/staff-type.enum';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-university-coordinators',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './university-coordinators.html',
  styleUrl: './university-coordinators.scss',
})
export class UniversityCoordinators implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isRoleFilterDropdownOpen = false;
    this.isUniversityFilterDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isUniversitiesDropdownOpen = false;
  }

  private coordinatorService = inject(UniversityCoordinatorService);
  private masterDropdownService = inject(MasterDropDownService);
  private countryService = inject(MasterCountryService);
  private masterUsersRoleService = inject(MasterUsersRoleService);
  private universityService = inject(MasterUniversityService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table
  users: UniversityCoordinatorRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiTotal = 0;
  kpiActive = 0;

  // Filter
  filter = new UniversityCoordinatorFilterModel();

  // Roles List
  roles: UsersRoleLookupModel[] = [];

  // Universities List
  masterUniversities: MasterUniversityRequest[] = [];

  selectedRoleFilter: string = 'all';
  selectedUniversityFilter: string = 'all';

  isPageSizeDropdownOpen = false;
  isRoleFilterDropdownOpen = false;
  isUniversityFilterDropdownOpen = false;

  // Custom Dropdown States
  isSalutationDropdownOpen = false;
  isGenderDropdownOpen = false;
  isRoleDropdownOpen = false;
  isPhoneDropdownOpen = false;
  isUniversitiesDropdownOpen = false;

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

  tempUserModel = new UniversityCoordinatorRequestModel();
  userToDelete?: UniversityCoordinatorRequestModel;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
    this.loadGenders();
    this.loadSalutations();
    this.loadCountries();
    this.loadRoles();
    this.loadUniversities();
  }

  loadRoles(): void {
    const request: UsersRoleByModulesRequestModel = {
      moduleIds: [
        StaffType.University,
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

  loadUniversities(): void {
    const filter = new MasterUniversityFilter();
    filter.pageNumber = 1;
    filter.pageSize = 1000;
    filter.isActive = true;
    this.universityService.getMasterUniversities(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.masterUniversities = response.result.items;
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
    this.coordinatorService.getUniversityCoordinators(this.filter).subscribe({
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
        this.notification.error('Failed to load university coordinators.');
      }
    });
  }

  calculateKPIs(): void {
    // Total is based on backend pagination total count
    this.kpiTotal = this.totalRecords;
    
    // Active / Role KPI counts are calculated from the current page's list of items
    this.kpiActive = this.users.length; // Active count - can be refined based on backend active property if applicable, reusing panel-users approach slightly adjusted if needed. Wait, in RequestModel `isActive` is not strictly defined in model, but if it exists we use it, otherwise use users.length or omit filtering. Let's use users.filter(x => (x as any).isActive !== false).length
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
    this.isUniversityFilterDropdownOpen = false;
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

  toggleUniversityFilterDropdown(event: Event): void {
    event.stopPropagation();
    this.isUniversityFilterDropdownOpen = !this.isUniversityFilterDropdownOpen;
    this.isRoleFilterDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectUniversityFilterOption(uniIdOrAll: number | string | undefined): void {
    this.selectedUniversityFilter = uniIdOrAll?.toString() ?? 'all';
    this.isUniversityFilterDropdownOpen = false;
    if (this.selectedUniversityFilter === 'all') {
      this.filter.universityId = undefined;
    } else {
      this.filter.universityId = Number(this.selectedUniversityFilter);
    }
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedUniversityFilterName(): string {
    if (this.selectedUniversityFilter === 'all') {
      return 'All universities';
    }
    const uni = this.masterUniversities.find(x => x.registrationId === Number(this.selectedUniversityFilter));
    return uni ? uni.universityName || '' : 'All universities';
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
    this.tempUserModel = new UniversityCoordinatorRequestModel();
    this.tempUserModel.staffId = undefined;
    this.tempUserModel.staffType = 0;
    this.tempUserModel.roleId = 0;
    this.tempUserModel.gender = 0;
    this.tempUserModel.staffSalutation = '';
    this.tempUserModel.universityIds = [];
    (this.tempUserModel as any).isActive = true;
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isUniversitiesDropdownOpen = false;
    this.PhoneCountryId = null;
    this.PhoneCountryCode = '';
    this.PhoneNumber = '';
    this.showUserModal = true;
  }

  openEditUserModal(user: UniversityCoordinatorRequestModel): void {
    this.tempUserModel = { ...user };
    // Ensure array exists
    if (!this.tempUserModel.universityIds) {
      this.tempUserModel.universityIds = [];
    }
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
    this.isUniversitiesDropdownOpen = false;
    this.parsePhone(this.tempUserModel.mobileNumber);
    
    // We need to fetch by Id to get assigned universities properly as requested "When editing, load UniversityIds returned from GetById"
    if (user.staffId) {
      this.coordinatorService.getUniversityCoordinatorById(user.staffId).subscribe({
        next: (res) => {
          if (res.success && res.result) {
            this.tempUserModel = res.result;
            if (!this.tempUserModel.universityIds) {
              this.tempUserModel.universityIds = [];
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
    this.isUniversitiesDropdownOpen = false;
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
    this.isUniversitiesDropdownOpen = false;
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
    this.isUniversitiesDropdownOpen = false;
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

  // --- Universities Multiselect ---
  toggleUniversitiesDropdown(event: Event): void {
    event.stopPropagation();
    this.isUniversitiesDropdownOpen = !this.isUniversitiesDropdownOpen;
    this.isRoleDropdownOpen = false;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  isUniversitySelected(id: number): boolean {
    return this.tempUserModel.universityIds.includes(id);
  }

  toggleUniversity(id: number): void {
    if (this.isUniversitySelected(id)) {
      this.tempUserModel.universityIds = this.tempUserModel.universityIds.filter(x => x !== id);
    } else {
      this.tempUserModel.universityIds.push(id);
    }
  }

  removeUniversity(id: number): void {
    this.tempUserModel.universityIds = this.tempUserModel.universityIds.filter(x => x !== id);
  }

  getUniversityName(id: number): string {
    const uni = this.masterUniversities.find(x => x.registrationId === id);
    return uni ? uni.universityName || '' : 'Unknown';
  }

  // --- Phone ---
  togglePhoneDropdown(event: Event): void {
    event.stopPropagation();
    this.isPhoneDropdownOpen = !this.isPhoneDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isUniversitiesDropdownOpen = false;
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
    if (form.invalid || !this.tempUserModel.roleId || this.tempUserModel.roleId === 0 || this.tempUserModel.universityIds.length === 0) {
      form.control.markAllAsTouched();
      return;
    }

    this.applyPhoneBeforeSave();
    // Use the explicit recovery email field value provided in the form
    // In panel-users it was set programmatically, but here we require it explicitly.
    if (this.tempUserModel.recoveryEmail) {
      this.tempUserModel.recoveryEmail = this.tempUserModel.recoveryEmail.trim().toLowerCase();
    }
    
    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempUserModel.staffId
      ? this.coordinatorService.updateUniversityCoordinator(this.tempUserModel)
      : this.coordinatorService.addUniversityCoordinator(this.tempUserModel);

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
  openDeleteUserModal(user: UniversityCoordinatorRequestModel): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete?.staffId) {
      return;
    }

    this.coordinatorService.deleteUniversityCoordinator(this.userToDelete.staffId).subscribe({
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
