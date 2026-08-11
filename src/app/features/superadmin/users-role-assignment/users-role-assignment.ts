import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { UsersRoleAssignmentService } from '../../../core/services/superadmin/users-role-assignment.service';
import { UsersLoginService } from '../../../core/services/superadmin/users-login.service';
import { UsersRoleAssignmentModel } from '../../../core/models/super-admin/users-role-assignment/users-role-assignment.model';
import { UsersRoleAssignmentFilterModel } from '../../../core/models/super-admin/users-role-assignment/users-role-assignment-filter.model';
import { UsersRoleAssignmentSaveModel } from '../../../core/models/super-admin/users-role-assignment/users-role-assignment-save.model';
import { UsersLoginRequestModel } from '../../../core/models/super-admin/users-login/users-login.model';
import { UsersLoginFilterModel } from '../../../core/models/super-admin/users-login/users-login-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-users-role-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './users-role-assignment.html',
  styleUrl: './users-role-assignment.scss',
})
export class UsersRoleAssignment implements OnInit {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isUserDropdownOpen = false;
  }

  private roleAssignmentService = inject(UsersRoleAssignmentService);
  private usersLoginService = inject(UsersLoginService);
  private notification = inject(NotificationService);

  // User Selection
  users: UsersLoginRequestModel[] = [];
  selectedLoginId: number | null = null;
  isUserDropdownOpen = false;

  // Assignments List
  assignmentsList: UsersRoleAssignmentModel[] = [];
  totalRecords = 0;
  searchText = '';

  filter = new UsersRoleAssignmentFilterModel();
  isPageSizeDropdownOpen = false;

  isSaving = false;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 0;
    this.loadUsers();
  }

  loadUsers(): void {
    const userFilter = new UsersLoginFilterModel();
    userFilter.pageNumber = 1;
    userFilter.pageSize = 1000;
    this.usersLoginService.getUserLogins(userFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.users = response.result.items;
        }
      }
    });
  }

  loadData(): void {
    if (!this.selectedLoginId) {
      this.assignmentsList = [];
      this.totalRecords = 0;
      return;
    }

    this.filter.loginId = this.selectedLoginId;
    this.filter.pageSize = 0; // Request all roles
    this.roleAssignmentService.getRoleAssignments(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.assignmentsList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.assignmentsList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.assignmentsList = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load role assignments.');
      }
    });
  }

  // --- User Dropdown ---
  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    this.isPageSizeDropdownOpen = false;
  }

  selectUserOption(loginId: number | null): void {
    this.selectedLoginId = loginId;
    this.isUserDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.searchText = '';
    this.filter.searchText = undefined;
    this.loadData();
  }

  getSelectedUserName(): string {
    if (!this.selectedLoginId) {
      return 'Select User...';
    }
    const u = this.users.find(x => x.loginId === this.selectedLoginId);
    return u ? u.loginName || '' : 'Select User...';
  }

  // --- Search & Filtering ---
  applySearch(): void {
    if (!this.selectedLoginId) return;
    this.filter.searchText = this.searchText.trim() || undefined;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSearch(): void {
    if (!this.selectedLoginId) return;
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

  // --- Page Size & Pagination ---
  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
    this.isUserDropdownOpen = false;
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

  // --- Role Checkbox Logic ---
  onMappedChange(role: UsersRoleAssignmentModel): void {
    if (!role.isMapped) {
      role.isDefault = false;
    }
  }

  setDefaultRole(role: UsersRoleAssignmentModel): void {
    if (!role.isMapped) return;
    
    // Set all other roles to false
    this.assignmentsList.forEach(r => r.isDefault = false);
    
    // Set this role to true
    role.isDefault = true;
  }

  // --- Bulk Save ---
  saveAssignments(): void {
    if (!this.selectedLoginId) {
      this.notification.warning('Please select a user first.');
      return;
    }

    this.isSaving = true;

    const saveModel = new UsersRoleAssignmentSaveModel();
    saveModel.loginId = this.selectedLoginId;
    saveModel.roles = this.assignmentsList;

    this.roleAssignmentService.saveRoleAssignments(saveModel).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success('Role assignments saved successfully');
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.notification.error(HelperMethods.getApiErrorMessage(err));
        } else {
          this.notification.error('An error occurred while saving assignments.');
        }
      }
    });
  }
}
