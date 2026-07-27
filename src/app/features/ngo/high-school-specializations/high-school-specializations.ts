import { Component, inject, OnInit, HostListener} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterDropDownFilter } from '../../../core/models/super-admin/master-dropdown/master-dropdown-filter.model';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-high-school-specializations',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './high-school-specializations.html',
  styleUrl: './high-school-specializations.scss',
})
export class HighSchoolSpecializations implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private dropdownService = inject(MasterDropDownService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table
  specializations: MasterDropDownRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new MasterDropDownFilter();

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.filter.parentId = MainDropdown.HighSchoolDivision;

    this.loadData();
  }

  loadData(): void {
    this.dropdownService.getMasterDropDowns(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.specializations = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.specializations = [];
          this.notification.warning(response.message);
        }
      },
      error: err => {
        this.specializations = [];
      }
    });
  }

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

  // pagesize dropdown
  isPageSizeDropdownOpen = false;

  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
  }

  selectPageSize(size: number): void {
    this.isPageSizeDropdownOpen = false;
    this.onPageSizeChange(size);
  }

  onPageSizeChange(size: number): void {
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
    return Math.ceil(this.totalRecords / this.filter.pageSize);
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber <= 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }

  showSpecializationModal = false;
  modalErrorMessage = '';
  tempSpecializationModel = new MasterDropDownRequest();

  openAddSpecializationModal(): void {
    this.tempSpecializationModel = new MasterDropDownRequest();
    this.modalErrorMessage = '';
    this.showSpecializationModal = true;
  }

  openEditSpecializationModal(specialization: MasterDropDownRequest): void {
    this.tempSpecializationModel = { ...specialization };
    this.modalErrorMessage = '';
    this.showSpecializationModal = true;
  }

  saveSpecialization(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.tempSpecializationModel.displayText || this.tempSpecializationModel.displayText.trim() === '') {
       this.modalErrorMessage = 'Specialization Name cannot be empty.';
       return;
    }

    this.tempSpecializationModel.displayText = this.tempSpecializationModel.displayText.trim();

    // Handle values programmatically as requested
    this.tempSpecializationModel.parentId = MainDropdown.HighSchoolDivision;
    this.tempSpecializationModel.isActive = true;
    this.tempSpecializationModel.isShow = true;
    this.tempSpecializationModel.isEditable = false;

    const request = this.tempSpecializationModel.uniqueId
      ? this.dropdownService.updateMasterDropDown(this.tempSpecializationModel)
      : this.dropdownService.addMasterDropDown(this.tempSpecializationModel);

    request.subscribe({
      next: () => {
        this.notification.success(this.tempSpecializationModel.uniqueId ? 'Specialization updated successfully' : 'Specialization added successfully');
        this.showSpecializationModal = false;
        this.loadData();
      },
      error: err => {
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        }
      }
    });
  }

  specializationToDelete?: MasterDropDownRequest;
  showDeleteModal = false;

  openDeleteSpecializationModal(specialization: MasterDropDownRequest): void {
    this.specializationToDelete = specialization;
    this.showDeleteModal = true;
  }

  confirmDeleteSpecialization(): void {
    if (!this.specializationToDelete?.uniqueId) {
      return;
    }

    this.dropdownService.deleteMasterDropDown(this.specializationToDelete.uniqueId).subscribe({
        next: () => {
          this.notification.success('Specialization deleted successfully');
          this.showDeleteModal = false;
          this.loadData();
        },
        error: err => {
          if (HelperMethods.isBusinessError(err)) {
            this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
          }
        }
      });
  }
}
