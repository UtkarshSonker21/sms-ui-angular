import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MasterDropDownFilter } from '../../../core/models/super-admin/master-dropdown/master-dropdown-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-master-dropdown-values',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective, RouterModule],
  templateUrl: './master-dropdown-values.html',
  styleUrl: './master-dropdown-values.scss',
})
export class MasterDropdownValues implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private masterDropdownService = inject(MasterDropDownService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Parent Info
  parentId!: number;
  dropdownName: string = '';

  // Table Data
  valuesList: MasterDropDownRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new MasterDropDownFilter();

  isPageSizeDropdownOpen = false;

  // Modal Dialogs
  showValueModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempValueModel = new MasterDropDownRequest();
  valueToDelete?: MasterDropDownRequest;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const nameParam = this.route.snapshot.paramMap.get('dropdownName');

    if (idParam) {
      this.parentId = Number(idParam);
    }
    if (nameParam) {
      this.dropdownName = nameParam;
    }

    if (!this.parentId) {
      this.notification.error('Invalid Dropdown ID');
      this.goBack();
      return;
    }

    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.filter.parentId = this.parentId;
    this.loadData();
  }

  loadData(): void {
    this.masterDropdownService.getMasterDropDowns(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          // Sort by displaySequence
          this.valuesList = response.result.items.sort((a, b) => 
            ((a.displaySequence || 0) - (b.displaySequence || 0))
          );
          this.totalRecords = response.result.totalCount;
        } else {
          this.valuesList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.valuesList = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load dropdown values.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dropdown-lists']);
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

  // --- Add / Edit Value Modal ---
  openAddValueModal(): void {
    this.tempValueModel = new MasterDropDownRequest();
    this.tempValueModel.uniqueId = undefined;
    this.tempValueModel.displayText = '';
    this.tempValueModel.parentId = this.parentId; // MUST match current parent
    // Default next sequence
    const maxSeq = this.valuesList.reduce((max, val) => Math.max(max, val.displaySequence || 0), 0);
    this.tempValueModel.displaySequence = maxSeq + 1;
    
    this.tempValueModel.isActive = true;
    this.modalErrorMessage = '';
    this.showValueModal = true;
  }

  openEditValueModal(val: MasterDropDownRequest): void {
    if (!val.uniqueId) return;
    this.masterDropdownService.getMasterDropDownById(val.uniqueId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempValueModel = { ...response.result };
          // enforce parentId remains unchanged
          this.tempValueModel.parentId = this.parentId;
          this.modalErrorMessage = '';
          this.showValueModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load value details.');
        }
      },
      error: () => {
        this.notification.error('Failed to load value details.');
      }
    });
  }

  saveValue(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    // Guarantee parentId
    this.tempValueModel.parentId = this.parentId;

    const request = this.tempValueModel.uniqueId
      ? this.masterDropdownService.updateMasterDropDown(this.tempValueModel)
      : this.masterDropdownService.addMasterDropDown(this.tempValueModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempValueModel.uniqueId ? 'Value Updated Successfully' : 'Value Created Successfully');
        this.showValueModal = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the value.';
        }
      }
    });
  }

  // --- Delete Value Modal ---
  openDeleteValueModal(val: MasterDropDownRequest): void {
    this.valueToDelete = val;
    this.showDeleteModal = true;
  }

  confirmDeleteValue(): void {
    if (!this.valueToDelete?.uniqueId) {
      return;
    }

    this.masterDropdownService.deleteMasterDropDown(this.valueToDelete.uniqueId).subscribe({
      next: () => {
        this.notification.success('Value Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting value.');
      }
    });
  }

}
