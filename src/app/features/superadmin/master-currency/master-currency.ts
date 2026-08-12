import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterCurrencyService } from '../../../core/services/superadmin/master-currency.service';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCurrencyRequest } from '../../../core/models/super-admin/master-currency/master-currency-request.model';
import { MasterCurrencyFilter } from '../../../core/models/super-admin/master-currency/master-currency-filter.model';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';

import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-master-currency',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './master-currency.html',
  styleUrl: './master-currency.scss',
})
export class MasterCurrency implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isCountryDropdownOpen = false;
  }

  private masterCurrencyService = inject(MasterCurrencyService);
  private masterCountryService = inject(MasterCountryService);
  private notification = inject(NotificationService);

  // Table Data
  currenciesList: MasterCurrencyRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new MasterCurrencyFilter();

  isPageSizeDropdownOpen = false;
  isCountryDropdownOpen = false;

  // Master Lists
  countries: MasterCountryRequest[] = [];

  // Modal Dialogs
  showCurrencyModal = false;
  showDeleteModal = false;
  isSaving = false;
  modalErrorMessage = '';

  tempCurrencyModel = new MasterCurrencyRequest();
  currencyToDelete?: MasterCurrencyRequest;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadCountries();
    this.loadData();
  }

  loadCountries(): void {
    const countryFilter = new MasterCountryFilter();
    countryFilter.pageNumber = 1;
    countryFilter.pageSize = 1000;
    this.masterCountryService.getMasterCountries(countryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countries = response.result.items;
        }
      }
    });
  }

  loadData(): void {
    this.masterCurrencyService.getMasterCurrencies(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.currenciesList = response.result.items;
          this.totalRecords = response.result.totalCount;
        } else {
          this.currenciesList = [];
          this.totalRecords = 0;
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.currenciesList = [];
        this.totalRecords = 0;
        this.notification.error('Failed to load currencies.');
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

  // --- Country Dropdown in Modal ---
  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
  }

  selectCountryOption(countryId: number | undefined): void {
    this.tempCurrencyModel.countryId = countryId;
    this.isCountryDropdownOpen = false;
  }

  getSelectedCountryName(): string {
    const countryId = this.tempCurrencyModel.countryId;
    if (!countryId) return 'Select Country...';
    return this.getCountryNameById(countryId) || 'Select Country...';
  }

  getCountryNameById(countryId: number | undefined): string {
    if (!countryId) return '';
    const c = this.countries.find(x => x.countryId === countryId);
    return c ? c.countryName || '' : '';
  }

  // --- Add / Edit Currency Modal ---
  openAddCurrencyModal(): void {
    this.tempCurrencyModel = new MasterCurrencyRequest();
    this.tempCurrencyModel.currencyId = undefined;
    this.tempCurrencyModel.currencyName = '';
    this.tempCurrencyModel.currencyCode = '';
    this.tempCurrencyModel.currencySymbol = '';
    this.tempCurrencyModel.countryId = undefined;
    this.tempCurrencyModel.isActive = true;
    this.modalErrorMessage = '';
    this.isCountryDropdownOpen = false;
    this.showCurrencyModal = true;
  }

  openEditCurrencyModal(currency: MasterCurrencyRequest): void {
    if (!currency.currencyId) return;
    this.masterCurrencyService.getMasterCurrencyById(currency.currencyId).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tempCurrencyModel = { ...response.result };
          this.modalErrorMessage = '';
          this.isCountryDropdownOpen = false;
          this.showCurrencyModal = true;
        } else {
          this.notification.error(response.message || 'Failed to load currency details.');
        }
      },
      error: () => {
        this.notification.error('Failed to load currency details.');
      }
    });
  }

  saveCurrency(form: NgForm): void {
    if (form.invalid || !this.tempCurrencyModel.countryId) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    const request = this.tempCurrencyModel.currencyId
      ? this.masterCurrencyService.updateMasterCurrency(this.tempCurrencyModel)
      : this.masterCurrencyService.addMasterCurrency(this.tempCurrencyModel);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success(this.tempCurrencyModel.currencyId ? 'Currency Updated Successfully' : 'Currency Created Successfully');
        this.showCurrencyModal = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An error occurred while saving the currency.';
        }
      }
    });
  }

  // --- Delete Currency Modal ---
  openDeleteCurrencyModal(currency: MasterCurrencyRequest): void {
    this.currencyToDelete = currency;
    this.showDeleteModal = true;
  }

  confirmDeleteCurrency(): void {
    if (!this.currencyToDelete?.currencyId) {
      return;
    }

    this.masterCurrencyService.deleteMasterCurrency(this.currencyToDelete.currencyId).subscribe({
      next: () => {
        this.notification.success('Currency Deleted Successfully');
        this.showDeleteModal = false;
        this.loadData();
      },
      error: () => {
        this.showDeleteModal = false;
        this.notification.error('Error occurred while deleting currency.');
      }
    });
  }

}
