import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { UsersMenuService } from '../../../core/services/superadmin/users-menu.service';
import { CommonService } from '../../../core/services/common/common.service';
import { UsersMenuRequestModel } from '../../../core/models/super-admin/users-menu/users-menu-request.model';
import { UsersMenuFilterModel } from '../../../core/models/super-admin/users-menu/users-menu-filter.model';
import { UsersModule } from '../../../core/models/common/settings/users-module.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

import { MenuService } from '../../../core/services/common/menu.service';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './menus.html',
  styleUrl: './menus.scss',
})
export class Menus implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isModuleDropdownOpen = false;
    this.isParentDropdownOpen = false;
    this.isModuleFilterDropdownOpen = false;
  }

  private usersMenuService = inject(UsersMenuService);
  private commonService = inject(CommonService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private menuService = inject(MenuService);

  // Table Data
  menusList: UsersMenuRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new UsersMenuFilterModel();

  selectedModuleFilter: string = 'all';

  isPageSizeDropdownOpen = false;
  isModuleFilterDropdownOpen = false;

  // Custom Dropdowns in Modal Form
  isModuleDropdownOpen = false;
  isParentDropdownOpen = false;

  // Master Lists
  modules: UsersModule[] = [];
  parentMenusList: UsersMenuRequestModel[] = []; // Potential parent menus
  filteredParentMenus: UsersMenuRequestModel[] = []; // Filtered parents displayed in dropdown

  // Modal Dialogs
  showMenuModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempMenuModel = new UsersMenuRequestModel();
  menuToDelete?: UsersMenuRequestModel;

  // Track original properties to preserve sequence when unchanged in edit mode
  originalModuleId?: number;
  originalParentId?: number;
  originalSequenceNo?: number;

  // Complete list of all menus (active and disabled) for calculating sequence numbers
  allMenusList: UsersMenuRequestModel[] = [];

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
    this.loadModules();
    this.loadParentMenus();
    this.loadAllMenus();
  }

  loadModules(): void {
    this.commonService.getAllUsersModule().subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.modules = response.result;
        }
      }
    });
  }

  loadParentMenus(): void {
    const parentFilter = new UsersMenuFilterModel();
    parentFilter.pageNumber = 1;
    parentFilter.pageSize = 1000;
    parentFilter.isActive = true;
    this.usersMenuService.getUserMenus(parentFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          // List of potential parent menus
          this.parentMenusList = response.result.items;
          this.updateFilteredParents();
        }
      }
    });
  }

  loadAllMenus(): void {
    const allFilter = new UsersMenuFilterModel();
    allFilter.pageNumber = 1;
    allFilter.pageSize = 1000;
    this.usersMenuService.getUserMenus(allFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.allMenusList = response.result.items;
        }
      }
    });
  }

  updateFilteredParents(): void {
    const currentModuleId = this.tempMenuModel.moduleId;
    this.filteredParentMenus = this.parentMenusList.filter(p => {
      const isSelf = p.menuLinkId === this.tempMenuModel.menuLinkId;
      if (isSelf) return false;
      
      if (!currentModuleId || Number(currentModuleId) === 0) {
        return true;
      }
      return Number(p.moduleId) === Number(currentModuleId);
    });
  }

  loadData(): void {
    this.usersMenuService.getUserMenus(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.menusList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.menusList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.menusList = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load menu records.');
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

  // --- Add / Edit Menu Modal ---
  openAddMenuModal(): void {
    this.tempMenuModel = new UsersMenuRequestModel();
    this.tempMenuModel.menuLinkId = undefined;
    this.tempMenuModel.moduleId = 0;
    this.tempMenuModel.pageHeading = '';
    this.tempMenuModel.parentId = undefined;
    this.tempMenuModel.pagePath = '';
    this.tempMenuModel.actualName = '';
    this.tempMenuModel.isView = true;
    this.tempMenuModel.isActive = true;
    this.tempMenuModel.levelNo = 0;
    this.tempMenuModel.sequenceNo = 1;
    this.tempMenuModel.icon = '';
    this.modalErrorMessage = '';
    this.isModuleDropdownOpen = false;
    this.isParentDropdownOpen = false;
    this.originalModuleId = undefined;
    this.originalParentId = undefined;
    this.originalSequenceNo = undefined;
    this.showMenuModal = true;
    this.updateFilteredParents();
    this.recalculateSequence();
  }

  openEditMenuModal(menu: UsersMenuRequestModel): void {
    if (!menu.menuLinkId) return;
    this.usersMenuService.getUserMenuById(menu.menuLinkId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempMenuModel = { ...response.result };
          this.originalModuleId = this.tempMenuModel.moduleId;
          this.originalParentId = this.tempMenuModel.parentId;
          this.originalSequenceNo = this.tempMenuModel.sequenceNo;
          this.modalErrorMessage = '';
          this.isModuleDropdownOpen = false;
          this.isParentDropdownOpen = false;
          this.updateFilteredParents();
          this.showMenuModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load menu details.');
        }
      },
      error: () => {
        this.notification.error('Failed to load menu details.');
      }
    });
  }

  toggleModuleDropdown(event: Event): void {
    event.stopPropagation();
    this.isModuleDropdownOpen = !this.isModuleDropdownOpen;
    this.isParentDropdownOpen = false;
  }

  selectModuleOption(moduleId: number): void {
    if (Number(this.tempMenuModel.moduleId) !== Number(moduleId)) {
      this.tempMenuModel.parentId = undefined;
      this.tempMenuModel.levelNo = 0;
    }
    this.tempMenuModel.moduleId = moduleId;
    this.isModuleDropdownOpen = false;
    this.updateFilteredParents();
  }

  getSelectedModuleName(): string {
    const moduleId = this.tempMenuModel.moduleId;
    if (!moduleId) return 'Select Module...';
    const mod = this.modules.find(x => x.moduleId === moduleId);
    return mod ? mod.moduleName || '' : 'Select Module...';
  }

  toggleParentDropdown(event: Event): void {
    event.stopPropagation();
    this.isParentDropdownOpen = !this.isParentDropdownOpen;
    this.isModuleDropdownOpen = false;
  }

  selectParentOption(parentId: number | undefined): void {
    this.tempMenuModel.parentId = parentId;
    this.isParentDropdownOpen = false;

    if (!parentId) {
      this.tempMenuModel.levelNo = 0;
    } else {
      const parent = this.parentMenusList.find(x => Number(x.menuLinkId) === Number(parentId));
      this.tempMenuModel.levelNo = parent ? (Number(parent.levelNo) || 0) + 1 : 0;
    }
    this.recalculateSequence();
  }

  getSelectedParentName(): string {
    const parentId = this.tempMenuModel.parentId;
    if (!parentId) return 'Select Parent Menu...';
    const parent = this.parentMenusList.find(x => Number(x.menuLinkId) === Number(parentId));
    return parent ? parent.pageHeading || '' : 'Select Parent Menu...';
  }

  recalculateSequence(): void {
    const isEditMode = !!this.tempMenuModel.menuLinkId;
    const currentParentId = this.tempMenuModel.parentId;

    if (isEditMode && Number(currentParentId) === Number(this.originalParentId)) {
      // Parent unchanged during edit mode, preserve original sequence
      this.tempMenuModel.sequenceNo = this.originalSequenceNo !== undefined ? this.originalSequenceNo : 1;
      return;
    }

    let menus = this.allMenusList;

    if (isEditMode) {
      // Exclude current menu itself from the count
      menus = menus.filter(x => Number(x.menuLinkId) !== Number(this.tempMenuModel.menuLinkId));
    }

    if (!currentParentId || Number(currentParentId) === 0) {
      this.tempMenuModel.sequenceNo = menus.filter(
        x => x.parentId == null || Number(x.parentId) === 0
      ).length + 1;
    } else {
      this.tempMenuModel.sequenceNo = menus.filter(
        x => x.parentId != null && Number(x.parentId) === Number(currentParentId)
      ).length + 1;
    }
  }

  saveMenu(form: NgForm): void {
    if (form.invalid || !this.tempMenuModel.moduleId || this.tempMenuModel.moduleId === 0) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempMenuModel.menuLinkId
      ? this.usersMenuService.updateUserMenu(this.tempMenuModel)
      : this.usersMenuService.addUserMenu(this.tempMenuModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempMenuModel.menuLinkId ? 'Menu Updated Successfully' : 'Menu Created Successfully');
        this.showMenuModal = false;
        this.loadData();
        this.loadParentMenus(); // Reload potential parents lists
        this.loadAllMenus(); // Reload sequence counting list
        this.menuService.reloadMenus(); // Refresh sidebar menu
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the menu.';
        }
      }
    });
  }

  // --- Delete Menu Modal ---
  openDeleteMenuModal(menu: UsersMenuRequestModel): void {
    this.menuToDelete = menu;
    this.showDeleteModal = true;
  }

  confirmDeleteMenu(): void {
    if (!this.menuToDelete?.menuLinkId) {
      return;
    }

    this.usersMenuService.deleteUserMenu(this.menuToDelete.menuLinkId).subscribe({
      next: () => {
        this.notification.success('Menu Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
        this.loadParentMenus(); // Reload potential parents lists
        this.loadAllMenus(); // Reload sequence counting list
        this.menuService.reloadMenus(); // Refresh sidebar menu
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting menu.');
      }
    });
  }

}

