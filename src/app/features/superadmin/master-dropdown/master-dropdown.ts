import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MasterDropDownFilter } from '../../../core/models/super-admin/master-dropdown/master-dropdown-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-master-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './master-dropdown.html',
  styleUrl: './master-dropdown.scss',
})
export class MasterDropdown implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private masterDropdownService = inject(MasterDropDownService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table Data
  dropdownsList: MasterDropDownRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new MasterDropDownFilter();

  isPageSizeDropdownOpen = false;

  // Modal Dialogs
  showDropdownModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempDropdownModel = new MasterDropDownRequest();
  dropdownToDelete?: MasterDropDownRequest;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.filter.parentId = null; // Important: only master dropdowns
    this.loadData();
  }

  loadData(): void {
    this.masterDropdownService.getMasterDropDowns(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.dropdownsList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.dropdownsList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.dropdownsList = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load master dropdowns.');
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

  // --- Add / Edit Dropdown Modal ---
  openAddDropdownModal(): void {
    this.tempDropdownModel = new MasterDropDownRequest();
    this.tempDropdownModel.uniqueId = undefined;
    this.tempDropdownModel.displayText = '';
    this.tempDropdownModel.parentId = undefined; // backend treats as null or omitted for parent
    this.tempDropdownModel.displaySequence = undefined;
    this.tempDropdownModel.isActive = true;
    this.modalErrorMessage = '';
    this.showDropdownModal = true;
  }

  openEditDropdownModal(dropdown: MasterDropDownRequest): void {
    if (!dropdown.uniqueId) return;
    this.masterDropdownService.getMasterDropDownById(dropdown.uniqueId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempDropdownModel = { ...response.result };
          this.modalErrorMessage = '';
          this.showDropdownModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load dropdown details.');
        }
      },
      error: () => {
        this.notification.error('Failed to load dropdown details.');
      }
    });
  }

  saveDropdown(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempDropdownModel.uniqueId
      ? this.masterDropdownService.updateMasterDropDown(this.tempDropdownModel)
      : this.masterDropdownService.addMasterDropDown(this.tempDropdownModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempDropdownModel.uniqueId ? 'Dropdown Updated Successfully' : 'Dropdown Created Successfully');
        this.showDropdownModal = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the dropdown.';
        }
      }
    });
  }

  // --- Delete Dropdown Modal ---
  openDeleteDropdownModal(dropdown: MasterDropDownRequest): void {
    this.dropdownToDelete = dropdown;
    this.showDeleteModal = true;
  }

  confirmDeleteDropdown(): void {
    if (!this.dropdownToDelete?.uniqueId) {
      return;
    }

    this.masterDropdownService.deleteMasterDropDown(this.dropdownToDelete.uniqueId).subscribe({
      next: () => {
        this.notification.success('Dropdown Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting dropdown.');
      }
    });
  }

  // --- Navigate to Values ---
  goToValues(dropdown: MasterDropDownRequest): void {
    if (!dropdown.uniqueId) return;
    const urlName = encodeURIComponent(dropdown.displayText.trim());
    this.router.navigate(['/dropdown-lists/value', dropdown.uniqueId, urlName]);
  }

}
