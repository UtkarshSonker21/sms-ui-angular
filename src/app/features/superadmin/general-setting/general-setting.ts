import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { GeneralSettingService } from '../../../core/services/superadmin/general-setting.service';
import { GeneralSettingModel } from '../../../core/models/super-admin/general-setting/general-setting.model';
import { GeneralSettingFilterModel } from '../../../core/models/super-admin/general-setting/general-setting-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-general-setting',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './general-setting.html',
  styleUrl: './general-setting.scss',
})
export class GeneralSetting implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private generalSettingService = inject(GeneralSettingService);
  private notification = inject(NotificationService);

  // Table Data
  settingsList: GeneralSettingModel[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new GeneralSettingFilterModel();

  isPageSizeDropdownOpen = false;

  // Modal Dialogs
  showSettingModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempSettingModel = new GeneralSettingModel();
  settingToDelete?: GeneralSettingModel;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
  }

  loadData(): void {
    this.generalSettingService.getGeneralSettings(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.settingsList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.settingsList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: (error) => {
        this.settingsList = [];
        this.totalRecords = 0;
        this.notification.handleBusinessError(
          error,
          'Failed to load general settings.'
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

  // --- Add / Edit Setting Modal ---
  openAddSettingModal(): void {
    this.tempSettingModel = new GeneralSettingModel();
    this.tempSettingModel.configId = null;
    this.tempSettingModel.configKey = '';
    this.tempSettingModel.configValue = '';
    this.tempSettingModel.configDescription = null;
    this.tempSettingModel.isActive = true;
    this.modalErrorMessage = '';
    this.showSettingModal = true;
  }

  openEditSettingModal(setting: GeneralSettingModel): void {
    if (!setting.configId) return;
    this.generalSettingService.getGeneralSettingById(setting.configId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempSettingModel = { ...response.result };
          this.modalErrorMessage = '';
          this.showSettingModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load setting details.');
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load setting details.'
        );
      }
    });
  }

  saveSetting(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempSettingModel.configId
      ? this.generalSettingService.updateGeneralSetting(this.tempSettingModel)
      : this.generalSettingService.addGeneralSetting(this.tempSettingModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempSettingModel.configId ? 'General Setting Updated Successfully' : 'General Setting Created Successfully');
        this.showSettingModal = false;
        this.loadData();
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.handleBusinessError(
          error,
          'Failed to save general setting.'
        );
      }
    });
  }

  // --- Delete Setting Modal ---
  openDeleteSettingModal(setting: GeneralSettingModel): void {
    this.settingToDelete = setting;
    this.showDeleteModal = true;
  }

  confirmDeleteSetting(): void {
    if (!this.settingToDelete?.configId) {
      return;
    }

    this.generalSettingService.deleteGeneralSetting(this.settingToDelete.configId).subscribe({
      next: () => {
        this.notification.success('General Setting Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: (error) => {
        this.showDeleteModal = false;
        this.notification.handleBusinessError(
          error,
          'Failed to delete general setting.'
        );
      }
    });
  }

}
