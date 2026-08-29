import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterUsersRoleService } from '../../../core/services/superadmin/master-users-roles.service';
import { CommonService } from '../../../core/services/common/common.service';
import { UsersRoleRequestModel } from '../../../core/models/super-admin/users-role/users-role-request.model';
import { UsersRoleFilterModel } from '../../../core/models/super-admin/users-role/users-role-filter.model';
import { UsersModule } from '../../../core/models/common/settings/users-module.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-users-role',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './users-role.html',
  styleUrl: './users-role.scss',
})
export class UsersRole implements OnInit {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isModuleFilterDropdownOpen = false;
    this.isModuleDropdownOpen = false;
  }

  private usersRoleService = inject(MasterUsersRoleService);
  private commonService = inject(CommonService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  rolesList: UsersRoleRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  filter = new UsersRoleFilterModel();

  selectedModuleFilter: string = 'all';

  isPageSizeDropdownOpen = false;
  isModuleFilterDropdownOpen = false;

  isModuleDropdownOpen = false;

  modules: UsersModule[] = [];

  showRoleModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempRoleModel = new UsersRoleRequestModel();
  roleToDelete?: UsersRoleRequestModel;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
    this.loadModules();
  }

  loadModules(): void {
    this.commonService.getAllUsersModule().subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.modules = response.result;
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load modules.'
        );
      }
    });
  }

  loadData(): void {
    this.usersRoleService.getUsersRoles(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.rolesList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.rolesList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: (error) => {
        this.rolesList = [];
        this.totalRecords = 0;
        this.notification.handleBusinessError(
          error,
          'Failed to load role records.'
        );
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

  toggleModuleFilterDropdown(event: Event): void {
    event.stopPropagation();
    this.isModuleFilterDropdownOpen = !this.isModuleFilterDropdownOpen;
    this.isPageSizeDropdownOpen = false;
  }

  selectModuleFilterOption(value: string | number): void {
    this.selectedModuleFilter = value.toString();
    this.isModuleFilterDropdownOpen = false;
    if (this.selectedModuleFilter === 'all') {
      this.filter.moduleId = undefined;
    } else {
      this.filter.moduleId = Number(this.selectedModuleFilter);
    }
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedModuleFilterName(): string {
    if (this.selectedModuleFilter === 'all') {
      return 'All modules';
    }
    const mod = this.modules.find(x => x.moduleId === Number(this.selectedModuleFilter));
    return mod ? mod.moduleName || '' : 'All modules';
  }

  // --- Page Size & Pagination ---
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

  // --- Add / Edit Modal ---
  openAddRoleModal(): void {
    this.tempRoleModel = new UsersRoleRequestModel();
    this.tempRoleModel.roleId = undefined;
    this.tempRoleModel.roleName = '';
    this.tempRoleModel.description = '';
    this.tempRoleModel.moduleId = 0;
    this.tempRoleModel.isActive = true;
    
    this.modalErrorMessage = '';
    this.isModuleDropdownOpen = false;
    this.showRoleModal = true;
  }

  openEditRoleModal(role: UsersRoleRequestModel): void {
    if (!role.roleId) return;
    this.usersRoleService.getUsersRoleById(role.roleId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempRoleModel = { ...response.result };
          this.modalErrorMessage = '';
          this.isModuleDropdownOpen = false;
          this.showRoleModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load role details.');
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load role details.'
        );
      }
    });
  }

  toggleModuleDropdown(event: Event): void {
    event.stopPropagation();
    this.isModuleDropdownOpen = !this.isModuleDropdownOpen;
  }

  selectModuleOption(moduleId: number): void {
    this.tempRoleModel.moduleId = moduleId;
    this.isModuleDropdownOpen = false;
  }

  getSelectedModuleName(): string {
    const moduleId = this.tempRoleModel.moduleId;
    if (!moduleId || moduleId === 0) return 'Select Module...';
    const mod = this.modules.find(x => x.moduleId === moduleId);
    return mod ? mod.moduleName || '' : 'Select Module...';
  }

  saveRole(form: NgForm): void {
    if (form.invalid || !this.tempRoleModel.moduleId || this.tempRoleModel.moduleId === 0) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempRoleModel.roleId
      ? this.usersRoleService.updateUsersRole(this.tempRoleModel)
      : this.usersRoleService.addUsersRole(this.tempRoleModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempRoleModel.roleId ? 'Role Updated Successfully' : 'Role Created Successfully');
        this.showRoleModal = false;
        this.loadData();
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.handleBusinessError(
          error,
          'Failed to save role.'
        );
      }
    });
  }

  // --- Delete Modal ---
  openDeleteRoleModal(role: UsersRoleRequestModel): void {
    this.roleToDelete = role;
    this.showDeleteModal = true;
  }

  confirmDeleteRole(): void {
    if (!this.roleToDelete?.roleId) {
      return;
    }

    this.usersRoleService.deleteUsersRole(this.roleToDelete.roleId).subscribe({
      next: () => {
        this.notification.success('Role Deleted Successfully');
        this.showDeleteModal = false;
        
        // Handle last item on page deleted
        if (this.rolesList.length === 1 && this.filter.pageNumber > 1) {
          this.filter.pageNumber--;
        }
        this.loadData();
      },
      error: (error) => {
        this.showDeleteModal = false;
        this.notification.handleBusinessError(
          error,
          'Failed to delete role.'
        );
      }
    });
  }
}
