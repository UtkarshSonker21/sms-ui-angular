import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { LanguageService } from '../../../core/services/superadmin/language.service';
import { LanguageRequestModel } from '../../../core/models/super-admin/language/language.model';
import { LanguageFilterModel } from '../../../core/models/super-admin/language/language-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-languages',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './languages.html',
  styleUrl: './languages.scss',
})
export class Languages implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private languageService = inject(LanguageService);
  private notification = inject(NotificationService);

  // Table Data
  languagesList: LanguageRequestModel[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new LanguageFilterModel();

  isPageSizeDropdownOpen = false;

  // Modal Dialogs
  showLanguageModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempLanguageModel = new LanguageRequestModel();
  languageToDelete?: LanguageRequestModel;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
  }

  loadData(): void {
    this.languageService.getLanguages(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.languagesList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.languagesList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.languagesList = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load languages.');
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

  // --- Add / Edit Language Modal ---
  openAddLanguageModal(): void {
    this.tempLanguageModel = new LanguageRequestModel();
    this.tempLanguageModel.languageId = null;
    this.tempLanguageModel.languageName = '';
    this.tempLanguageModel.languageCode = '';
    this.tempLanguageModel.cultureCode = '';
    this.tempLanguageModel.isRTL = false;
    // Backend/System managed defaults
    this.tempLanguageModel.isActive = true; 
    this.tempLanguageModel.isDefault = false;
    
    this.modalErrorMessage = '';
    this.showLanguageModal = true;
  }

  openEditLanguageModal(lang: LanguageRequestModel): void {
    if (!lang.languageId) return;
    this.languageService.getLanguageById(lang.languageId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempLanguageModel = { ...response.result };
          this.modalErrorMessage = '';
          this.showLanguageModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load language details.');
        }
      },
      error: () => {
        this.notification.error('Failed to load language details.');
      }
    });
  }

  saveLanguage(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempLanguageModel.languageId
      ? this.languageService.updateLanguage(this.tempLanguageModel)
      : this.languageService.addLanguage(this.tempLanguageModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempLanguageModel.languageId ? 'Language Updated Successfully' : 'Language Created Successfully');
        this.showLanguageModal = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the language.';
        }
      }
    });
  }

  // --- Delete Language Modal ---
  openDeleteLanguageModal(lang: LanguageRequestModel): void {
    this.languageToDelete = lang;
    this.showDeleteModal = true;
  }

  confirmDeleteLanguage(): void {
    if (!this.languageToDelete?.languageId) {
      return;
    }

    this.languageService.deleteLanguage(this.languageToDelete.languageId).subscribe({
      next: () => {
        this.notification.success('Language Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting language.');
      }
    });
  }

}
