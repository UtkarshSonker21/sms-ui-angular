import { Component, inject, OnInit, HostListener} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-preferences-countries',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './preferences-countries.html',
  styleUrl: './preferences-countries.scss',
})
export class PreferencesCountries implements OnInit {

  // close all dropdown on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private countryService = inject(MasterCountryService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table
  countries: MasterCountryRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new MasterCountryFilter();

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;

    this.loadData();
  }

  loadData(): void {
    this.countryService.getMasterCountries(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countries = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.countries = [];
          this.notification.warning(response.message);
        }
      },
      error: (error) => {
        this.countries = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load countries.'
        );
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

  showCountryModal = false;
  modalErrorMessage = '';
  tempCountryModel = new MasterCountryRequest();

  openAddCountryModal(): void {
    this.tempCountryModel = new MasterCountryRequest();
    this.modalErrorMessage = '';
    this.showCountryModal = true;
  }

  openEditCountryModal(country: MasterCountryRequest): void {
    this.tempCountryModel = { ...country };
    this.modalErrorMessage = '';
    this.showCountryModal = true;
  }

  saveCountry(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const request = this.tempCountryModel.countryId
      ? this.countryService.updateMasterCountry(this.tempCountryModel)
      : this.countryService.addMasterCountry(this.tempCountryModel);

    request.subscribe({
      next: () => {
        this.notification.success(this.tempCountryModel.countryId ? 'Country updated successfully' : 'Country added successfully');
        this.showCountryModal = false;
        this.loadData();
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to save country.'
        );
      }
    });
  }

  countryToDelete?: MasterCountryRequest;
  showDeleteModal = false;

  openDeleteCountryModal(country: MasterCountryRequest): void {
    this.countryToDelete = country;
    this.showDeleteModal = true;
  }

  confirmDeleteCountry(): void {
    if (!this.countryToDelete?.countryId) {
      return;
    }

    this.countryService.deleteMasterCountry(this.countryToDelete.countryId).subscribe({
        next: () => {
          this.notification.success('Country deleted successfully');
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
