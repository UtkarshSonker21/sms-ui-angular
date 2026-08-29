import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { LabelService } from '../../../core/services/superadmin/label.service';
import { CommonService } from '../../../core/services/common/common.service';
import { LabelRequestModel } from '../../../core/models/super-admin/labels/label.model';
import { LabelFilterModel } from '../../../core/models/super-admin/labels/label-filter.model';
import { UsersModule } from '../../../core/models/common/settings/users-module.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-labels',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './labels.html',
  styleUrl: './labels.scss',
})
export class Labels implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isFilterModuleDropdownOpen = false;
    this.isFormModuleDropdownOpen = false;
  }

  private labelService = inject(LabelService);
  private commonService = inject(CommonService);
  private notification = inject(NotificationService);

  // Table Data
  labelsList: LabelRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new LabelFilterModel();

  isPageSizeDropdownOpen = false;
  isFilterModuleDropdownOpen = false;
  isFormModuleDropdownOpen = false;

  // Master Lists
  modules: UsersModule[] = [];

  // Modal Dialogs
  showLabelModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempLabelModel = new LabelRequestModel();
  labelToDelete?: LabelRequestModel;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadModules();
    this.loadData();
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
    this.labelService.getLabels(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.labelsList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.labelsList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: (error) => {
        this.labelsList = [];
        this.totalRecords = 0;
        this.notification.handleBusinessError(
          error,
          'Failed to load labels.'
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

  toggleFilterModuleDropdown(event: Event): void {
    event.stopPropagation();
    this.isFilterModuleDropdownOpen = !this.isFilterModuleDropdownOpen;
  }

  selectFilterModuleOption(moduleId: number | undefined | null): void {
    this.filter.moduleId = moduleId;
    this.isFilterModuleDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getFilterModuleSelectionText(): string {
    if (!this.filter.moduleId) return 'All Modules';
    const m = this.modules.find(x => x.moduleId === this.filter.moduleId);
    return m ? m.moduleName : 'All Modules';
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

  // --- Form Module Dropdown ---
  toggleFormModuleDropdown(event: Event): void {
    if (this.tempLabelModel.labelId) return; // Prevent change on Edit
    event.stopPropagation();
    this.isFormModuleDropdownOpen = !this.isFormModuleDropdownOpen;
  }

  selectFormModuleOption(moduleId: number | undefined | null): void {
    this.tempLabelModel.moduleId = moduleId;
    this.isFormModuleDropdownOpen = false;
  }

  getFormModuleSelectionText(): string {
    const moduleId = this.tempLabelModel.moduleId;
    if (!moduleId) return 'Select Module...';
    const m = this.modules.find(x => x.moduleId === moduleId);
    return m ? m.moduleName : 'Select Module...';
  }

  getModuleNameById(moduleId: number | undefined | null): string {
    if (!moduleId) return '-';
    const m = this.modules.find(x => x.moduleId === moduleId);
    return m ? m.moduleName : '-';
  }

  // --- Add / Edit Label Modal ---
  openAddLabelModal(): void {
    this.tempLabelModel = new LabelRequestModel();
    this.tempLabelModel.labelId = null;
    this.tempLabelModel.moduleId = null;
    this.tempLabelModel.labelKey = '';
    this.tempLabelModel.labelValue = '';
    this.tempLabelModel.isActive = true; 
    
    this.modalErrorMessage = '';
    this.isFormModuleDropdownOpen = false;
    this.showLabelModal = true;
  }

  openEditLabelModal(lbl: LabelRequestModel): void {
    if (!lbl.labelId) return;
    this.labelService.getLabelById(lbl.labelId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempLabelModel = { ...response.result };
          this.modalErrorMessage = '';
          this.isFormModuleDropdownOpen = false;
          this.showLabelModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load label details.');
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load label details.'
        );
      }
    });
  }

  saveLabel(form: NgForm): void {
    if (form.invalid || !this.tempLabelModel.moduleId) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempLabelModel.labelId
      ? this.labelService.updateLabel(this.tempLabelModel)
      : this.labelService.addLabel(this.tempLabelModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempLabelModel.labelId ? 'Label Updated Successfully' : 'Label Created Successfully');
        this.showLabelModal = false;
        this.loadData();
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.handleBusinessError(
          error,
          'Failed to save label.'
        );
      }
    });
  }

  // --- Delete Label Modal ---
  openDeleteLabelModal(lbl: LabelRequestModel): void {
    this.labelToDelete = lbl;
    this.showDeleteModal = true;
  }

  confirmDeleteLabel(): void {
    if (!this.labelToDelete?.labelId) {
      return;
    }

    this.labelService.deleteLabel(this.labelToDelete.labelId).subscribe({
      next: () => {
        this.notification.success('Label Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: (error) => {
        this.showDeleteModal = false;
        this.notification.handleBusinessError(
          error,
          'Failed to delete label.'
        );
      }
    });
  }

}
