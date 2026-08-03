import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { PanelUserService } from '../../../core/services/ngo/panel-users.service';
import { PanelUserRequestModel } from '../../../core/models/ngo/panel-users/panel-user-request.model';
import { PanelUserFilterModel } from '../../../core/models/ngo/panel-users/panel-user-filter.dto';

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
  }

  private panelUserService = inject(PanelUserService);
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

  // Roles Static List
  roles = [
    { id: 2, name: 'Committee', staffType: 2 },
    { id: 5, name: 'Marketing', staffType: 5 },
    { id: 6, name: 'Finance', staffType: 6 }
  ];

  selectedRoleFilter: string = 'all';
  selectedStatusFilter: string = 'all';

  isPageSizeDropdownOpen = false;
  isRoleFilterDropdownOpen = false;
  isStatusFilterDropdownOpen = false;

  // Custom Dropdown States
  isSalutationDropdownOpen = false;
  isGenderDropdownOpen = false;
  isRoleDropdownOpen = false;

  salutations: string[] = ['Mr.', 'Ms.', 'Dr.', 'Eng.'];
  genders: string[] = ['Male', 'Female'];

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
      this.filter.staffType = id;
    }
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedRoleFilterName(): string {
    if (this.selectedRoleFilter === 'all') {
      return 'All roles';
    }
    const role = this.roles.find(x => x.id === Number(this.selectedRoleFilter));
    return role ? role.name : 'All roles';
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
    this.tempUserModel.gender = '';
    this.tempUserModel.staffSalutation = '';
    this.tempUserModel.isActive = true;
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.showUserModal = true;
  }

  openEditUserModal(user: PanelUserRequestModel): void {
    this.tempUserModel = { ...user };
    this.modalErrorMessage = '';
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.showUserModal = true;
  }

  toggleSalutationDropdown(event: Event): void {
    event.stopPropagation();
    this.isSalutationDropdownOpen = !this.isSalutationDropdownOpen;
    this.isGenderDropdownOpen = false;
    this.isRoleDropdownOpen = false;
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
  }

  selectGenderOption(option: string): void {
    this.tempUserModel.gender = option;
    this.isGenderDropdownOpen = false;
  }

  toggleRoleDropdown(event: Event): void {
    event.stopPropagation();
    this.isRoleDropdownOpen = !this.isRoleDropdownOpen;
    this.isSalutationDropdownOpen = false;
    this.isGenderDropdownOpen = false;
  }

  selectRoleOption(roleId: number): void {
    this.tempUserModel.roleId = roleId;
    this.tempUserModel.staffType = roleId;
    this.isRoleDropdownOpen = false;
  }

  getSelectedRoleName(): string {
    const r = this.roles.find(x => x.id === this.tempUserModel.roleId);
    return r ? r.name : '';
  }

  saveUser(form: NgForm): void {
    if (form.invalid || !this.tempUserModel.roleId || this.tempUserModel.roleId === 0) {
      form.control.markAllAsTouched();
      return;
    }

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
