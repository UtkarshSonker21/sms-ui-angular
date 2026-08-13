import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { LanguageTranslationService } from '../../../core/services/superadmin/language-translation.service';
import { CommonService } from '../../../core/services/common/common.service';

import { LanguageTranslationManagementModel } from '../../../core/models/super-admin/language-translations/language-translation-management.model';
import { LanguageTranslationFilterModel } from '../../../core/models/super-admin/language-translations/language-translation-filter.model';
import { LanguageTranslationRequestModel } from '../../../core/models/super-admin/language-translations/language-translation-request.model';
import { LanguageTranslationItemModel } from '../../../core/models/super-admin/language-translations/language-translation-item.model';
import { UsersModule } from '../../../core/models/common/settings/users-module.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-language-translations',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './language-translations.html',
  styleUrl: './language-translations.scss',
})
export class LanguageTranslations implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isFilterModuleDropdownOpen = false;
  }

  private translationService = inject(LanguageTranslationService);
  private commonService = inject(CommonService);
  private notification = inject(NotificationService);

  // Table Data
  managementList: LanguageTranslationManagementModel[] = [];
  dynamicLanguages: { languageId: number; languageName: string; languageCode: string }[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new LanguageTranslationFilterModel();

  isPageSizeDropdownOpen = false;
  isFilterModuleDropdownOpen = false;

  // Master Lists
  modules: UsersModule[] = [];

  // Modal Dialogs
  showTranslationModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempTranslationModel = new LanguageTranslationRequestModel();
  englishMasterValue: string = '';
  translationToDeleteId?: number;

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
      }
    });
  }

  loadData(): void {
    this.translationService.getLanguageTranslationsManagement(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.managementList = response.result.items;
          this.totalRecords = response.result.totalCount;

          // Extract dynamic columns from the first item
          if (this.managementList.length > 0) {
            this.dynamicLanguages = this.managementList[0].translations.map(t => ({
              languageId: t.languageId,
              languageName: t.languageName,
              languageCode: t.languageCode
            }));
          } else {
            this.dynamicLanguages = [];
          }
        } else {
          this.managementList = [];
          this.totalRecords = 0;
          this.dynamicLanguages = [];
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.managementList = [];
        this.totalRecords = 0;
        this.dynamicLanguages = [];
        this.notification.error('Failed to load translations.');
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

  // --- Click to Add / Edit Translation ---
  openTranslationModal(managementItem: LanguageTranslationManagementModel, translationItem: LanguageTranslationItemModel): void {
    this.tempTranslationModel = new LanguageTranslationRequestModel();
    
    // Identifiers
    this.tempTranslationModel.translationId = translationItem.translationId || null;
    this.tempTranslationModel.labelId = managementItem.labelId;
    this.tempTranslationModel.languageId = translationItem.languageId;
    
    // Values
    this.tempTranslationModel.labelValue = translationItem.value || '';
    
    // Display metadata (read-only for modal)
    this.tempTranslationModel.labelKey = managementItem.labelKey;
    this.tempTranslationModel.languageName = translationItem.languageName;
    
    // Store master value independently for the UI
    this.englishMasterValue = managementItem.englishMasterValue;

    this.modalErrorMessage = '';
    this.showTranslationModal = true;
  }

  saveTranslation(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempTranslationModel.translationId
      ? this.translationService.updateLanguageTranslation(this.tempTranslationModel)
      : this.translationService.addLanguageTranslation(this.tempTranslationModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempTranslationModel.translationId ? 'Translation Updated Successfully' : 'Translation Created Successfully');
        this.showTranslationModal = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the translation.';
        }
      }
    });
  }

  // --- Delete Translation ---
  openDeleteModal(): void {
    if (!this.tempTranslationModel.translationId) return;
    this.translationToDeleteId = this.tempTranslationModel.translationId;
    this.showTranslationModal = false;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.showTranslationModal = true;
  }

  confirmDeleteTranslation(): void {
    if (!this.translationToDeleteId) return;

    this.translationService.deleteLanguageTranslation(this.translationToDeleteId).subscribe({
      next: () => {
        this.notification.success('Translation Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting translation.');
      }
    });
  }

}
