import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { CommonService } from '../../../core/services/common/common.service';
import { MenuService } from '../../../core/services/common/menu.service';
import { MasterUsersRoleService } from '../../../core/services/superadmin/master-users-roles.service';
import { UsersRolePermissionService } from '../../../core/services/superadmin/users-role-permission.service';

import { UsersModule } from '../../../core/models/common/settings/users-module.model';
import { UsersRoleRequestModel } from '../../../core/models/super-admin/users-role/users-role-request.model';
import { UsersRoleFilterModel } from '../../../core/models/super-admin/users-role/users-role-filter.model';

import { UsersRolePermissionModel } from '../../../core/models/super-admin/users-role-permission/users-role-permission.model';
import { UsersRolePermissionFilterModel } from '../../../core/models/super-admin/users-role-permission/users-role-permission-filter.model';
import { UsersRolePermissionBulkSaveModel } from '../../../core/models/super-admin/users-role-permission/users-role-permission-bulk-save.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-users-role-permission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-role-permission.html',
  styleUrl: './users-role-permission.scss',
})
export class UsersRolePermission implements OnInit {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isModuleDropdownOpen = false;
    this.isRoleDropdownOpen = false;
  }

  private commonService = inject(CommonService);
  private menuService = inject(MenuService);
  private rolesService = inject(MasterUsersRoleService);
  private permissionsService = inject(UsersRolePermissionService);
  private notification = inject(NotificationService);

  // Module
  modules: UsersModule[] = [];
  selectedModuleId: number | null = null;
  isModuleDropdownOpen = false;

  // Role
  roles: UsersRoleRequestModel[] = [];
  selectedRoleId: number | null = null;
  isRoleDropdownOpen = false;

  // Permissions
  permissions: UsersRolePermissionModel[] = [];
  isSaving = false;

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    this.commonService.getAllUsersModule().subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.modules = res.result;
        }
      }
    });
  }

  // --- Module Selection ---
  toggleModuleDropdown(event: Event): void {
    event.stopPropagation();
    this.isModuleDropdownOpen = !this.isModuleDropdownOpen;
    this.isRoleDropdownOpen = false;
  }

  selectModule(moduleId: number | null): void {
    this.selectedModuleId = moduleId;
    this.isModuleDropdownOpen = false;

    // Clear role & permissions
    this.selectedRoleId = null;
    this.roles = [];
    this.permissions = [];

    if (this.selectedModuleId) {
      this.loadRolesForModule();
    }
  }

  getSelectedModuleName(): string {
    if (!this.selectedModuleId) return 'Select Module...';
    const m = this.modules.find(x => x.moduleId === this.selectedModuleId);
    return m ? m.moduleName || 'Select Module...' : 'Select Module...';
  }

  // --- Role Selection ---
  loadRolesForModule(): void {
    const filter = new UsersRoleFilterModel();
    filter.moduleId = this.selectedModuleId??0;
    filter.pageNumber = 1;
    filter.pageSize = 1000;

    this.rolesService.getUsersRoles(filter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.roles = res.result.items;
        }
      }
    });
  }

  toggleRoleDropdown(event: Event): void {
    if (!this.selectedModuleId) return;
    event.stopPropagation();
    this.isRoleDropdownOpen = !this.isRoleDropdownOpen;
    this.isModuleDropdownOpen = false;
  }

  selectRole(roleId: number | null): void {
    this.selectedRoleId = roleId;
    this.isRoleDropdownOpen = false;
    this.permissions = [];

    if (this.selectedRoleId) {
      this.loadPermissions();
    }
  }

  getSelectedRoleName(): string {
    if (!this.selectedRoleId) return 'Select Role...';
    const r = this.roles.find(x => x.roleId === this.selectedRoleId);
    return r ? r.roleName || 'Select Role...' : 'Select Role...';
  }

  // --- Permissions ---
  loadPermissions(): void {
    if (!this.selectedRoleId || !this.selectedModuleId) return;

    const filter = new UsersRolePermissionFilterModel();
    filter.roleId = this.selectedRoleId;
    filter.moduleId = this.selectedModuleId;
    filter.pageNumber = 1;
    filter.pageSize = 0; // Request all permissions

    this.permissionsService.getRolePermissions(filter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.permissions = res.result.items || [];
        } else {
          this.permissions = [];
          this.notification.warning(res.message);
        }
      },
      error: () => {
        this.permissions = [];
        this.notification.error('Failed to load permissions.');
      }
    });
  }

  // --- Header Checkboxes ---
  get allViewChecked(): boolean {
    return this.permissions.length > 0 && this.permissions.every(p => p.viewPer);
  }
  set allViewChecked(val: boolean) {
    this.permissions.forEach(p => p.viewPer = val);
  }

  get allInsertChecked(): boolean {
    return this.permissions.length > 0 && this.permissions.every(p => p.insertPer);
  }
  set allInsertChecked(val: boolean) {
    this.permissions.forEach(p => p.insertPer = val);
  }

  get allUpdateChecked(): boolean {
    return this.permissions.length > 0 && this.permissions.every(p => p.updatePer);
  }
  set allUpdateChecked(val: boolean) {
    this.permissions.forEach(p => p.updatePer = val);
  }

  get allDeleteChecked(): boolean {
    return this.permissions.length > 0 && this.permissions.every(p => p.deletePer);
  }
  set allDeleteChecked(val: boolean) {
    this.permissions.forEach(p => p.deletePer = val);
  }

  // --- Bulk Save ---
  savePermissions(): void {
    if (!this.selectedRoleId) {
      this.notification.warning('Please select a role first.');
      return;
    }

    if (this.permissions.length === 0) {
      this.notification.warning('No permissions to save.');
      return;
    }

    this.isSaving = true;

    const model = new UsersRolePermissionBulkSaveModel();
    model.roleId = this.selectedRoleId;
    model.permissions = this.permissions;

    this.permissionsService.bulkSaveRolePermissions(model).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.notification.success(res.message || 'Permissions saved successfully.');
          this.menuService.reloadMenus();
          this.loadPermissions();
        } else {
          this.notification.warning(res.message);
        }
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.notification.error(HelperMethods.getApiErrorMessage(err));
        } else {
          this.notification.error('An error occurred while saving permissions.');
        }
      }
    });
  }
}
