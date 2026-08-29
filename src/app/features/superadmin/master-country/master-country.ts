import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-master-country',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './master-country.html',
  styleUrl: './master-country.scss',
})
export class MasterCountry implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private masterCountryService = inject(MasterCountryService);
  private notification = inject(NotificationService);

  // Table Data
  countriesList: MasterCountryRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new MasterCountryFilter();

  isPageSizeDropdownOpen = false;

  // Modal Dialogs
  showCountryModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempCountryModel = new MasterCountryRequest();
  countryToDelete?: MasterCountryRequest;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
  }

  loadData(): void {
    this.masterCountryService.getMasterCountries(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countriesList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.countriesList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: (error) => {
        this.countriesList = [];
        this.totalRecords = 0;
        this.notification.handleBusinessError(
          error,
          'Failed to load countries.'
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

  // --- Add / Edit Country Modal ---
  openAddCountryModal(): void {
    this.tempCountryModel = new MasterCountryRequest();
    this.tempCountryModel.countryId = undefined;
    this.tempCountryModel.countryName = '';
    this.tempCountryModel.countryIsdCode = null as any;
    this.tempCountryModel.countryAlphaCode3 = undefined;
    this.tempCountryModel.isActive = true;
    this.modalErrorMessage = '';
    this.showCountryModal = true;
  }

  openEditCountryModal(country: MasterCountryRequest): void {
    if (!country.countryId) return;
    this.masterCountryService.getMasterCountryById(country.countryId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempCountryModel = { ...response.result };
          this.modalErrorMessage = '';
          this.showCountryModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load country details.');
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load country details.'
        );
      }
    });
  }

  saveCountry(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempCountryModel.countryId
      ? this.masterCountryService.updateMasterCountry(this.tempCountryModel)
      : this.masterCountryService.addMasterCountry(this.tempCountryModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempCountryModel.countryId ? 'Country Updated Successfully' : 'Country Created Successfully');
        this.showCountryModal = false;
        this.loadData();
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.handleBusinessError(
          error,
          'Failed to save country.'
        );
      }
    });
  }

  // --- Delete Country Modal ---
  openDeleteCountryModal(country: MasterCountryRequest): void {
    this.countryToDelete = country;
    this.showDeleteModal = true;
  }

  confirmDeleteCountry(): void {
    if (!this.countryToDelete?.countryId) {
      return;
    }

    this.masterCountryService.deleteMasterCountry(this.countryToDelete.countryId).subscribe({
      next: () => {
        this.notification.success('Country Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: (error) => {
        this.showDeleteModal = false;
        this.notification.handleBusinessError(
          error,
          'Failed to delete country.'
        );
      }
    });
  }

}
