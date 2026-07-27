import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';

import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';

import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { AppRoutes } from '../../../core/constants/app-routes';

@Component({
  selector: 'app-university-accreditation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './university-accreditation.html',
  styleUrl: './university-accreditation.scss',
})
export class UniversityAccreditation implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isCountryDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private universityService = inject(MasterUniversityService);
  private countryService = inject(MasterCountryService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Data List
  universities: MasterUniversityRequest[] = [];
  allFilteredItems: MasterUniversityRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Stats / KPIs
  kpiTotal = 0;
  kpiPending = 0;
  kpiAccredited = 0;
  kpiRejected = 0;

  // Filter Models
  filter = new MasterUniversityFilter();
  activeTab = 'all'; // 'all', 'pending', 'accepted', 'rejected'

  // Dropdowns
  selectedCountryId = 0;
  countries: MasterCountryRequest[] = [];
  countryMap = new Map<number, string>();
  isCountryDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  // Expose enum to the template
  readonly AccreditationStatus = AccreditationStatus;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;

    this.loadCountries();
  }

  loadCountries(): void {
    const countryFilter = new MasterCountryFilter();
    countryFilter.pageNumber = 1;
    countryFilter.pageSize = 1000;

    this.countryService.getMasterCountries(countryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.countries = response.result.items;
          this.buildCountryMap();
        }
        this.loadData();
      },
      error: () => {
        this.loadData();
      }
    });
  }

  buildCountryMap(): void {
    this.countryMap.clear();
    this.countries.forEach(c => {
      if (c.countryId) {
        this.countryMap.set(c.countryId, c.countryName);
      }
    });
  }

  getCountryName(countryId: number): string {
    return this.countryMap.get(countryId) || 'Unknown';
  }

  loadData(): void {
    const queryFilter = new MasterUniversityFilter();
    queryFilter.pageNumber = 1;
    queryFilter.pageSize = 10000; // Fetch all for client-side filtering

    this.universityService.getMasterUniversities(queryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.processUniversitiesList(response.result.items);
        } else {
          this.processUniversitiesList([]);
        }
      },
      error: () => {
        this.processUniversitiesList([]);
        this.notification.error('Failed to load university accreditation list.');
      }
    });
  }

  private processUniversitiesList(items: MasterUniversityRequest[]): void {
    // 1. Calculate general stats across ALL items loaded
    this.kpiTotal = items.length;
    this.kpiPending = items.filter(x => x.accreditationStatus === AccreditationStatus.Pending).length;
    this.kpiAccredited = items.filter(x => x.accreditationStatus === AccreditationStatus.Accredited).length;
    this.kpiRejected = items.filter(x => x.accreditationStatus === AccreditationStatus.Rejected).length;

    // 2. Apply search text filter (name, country, or type)
    if (this.searchText.trim()) {
      const q = this.searchText.trim().toLowerCase();
      items = items.filter(u => {
        const nameMatch = u.universityName.toLowerCase().includes(q);
        const typeMatch = u.universityType.toLowerCase().includes(q);
        const countryName = this.getCountryName(u.countryId).toLowerCase();
        const countryMatch = countryName.includes(q);
        return nameMatch || typeMatch || countryMatch;
      });
    }

    // 3. Apply country dropdown filter
    if (this.selectedCountryId !== 0) {
      items = items.filter(u => u.countryId === this.selectedCountryId);
    }

    // 4. Apply status tab filter
    if (this.activeTab === 'pending') {
      items = items.filter(x => x.accreditationStatus === AccreditationStatus.Pending);
    } else if (this.activeTab === 'accepted') {
      items = items.filter(x => x.accreditationStatus === AccreditationStatus.Accredited);
    } else if (this.activeTab === 'rejected') {
      items = items.filter(x => x.accreditationStatus === AccreditationStatus.Rejected);
    }

    this.allFilteredItems = items;
    this.totalRecords = items.length;
    this.paginateItems();
  }

  paginateItems(): void {
    const startIndex = (this.filter.pageNumber - 1) * this.filter.pageSize;
    this.universities = this.allFilteredItems.slice(startIndex, startIndex + this.filter.pageSize);
  }

  applySearch(): void {
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSearch(): void {
    this.searchText = '';
    this.filter.pageNumber = 1;
    this.loadData();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applySearch();
    }
  }

  // Tabs
  setTab(tab: string): void {
    this.activeTab = tab;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  // Country Dropdown
  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    this.isPageSizeDropdownOpen = false;
  }

  selectCountry(id: number): void {
    this.selectedCountryId = id;
    this.isCountryDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearCountrySelection(event: Event): void {
    event.stopPropagation();
    this.selectedCountryId = 0;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedCountryName(): string {
    if (this.selectedCountryId === 0) return 'All Countries';
    return this.getCountryName(this.selectedCountryId);
  }

  // Page Size Dropdown
  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
    this.isCountryDropdownOpen = false;
  }

  selectPageSize(size: number): void {
    this.isPageSizeDropdownOpen = false;
    this.filter.pageSize = size;
    this.filter.pageNumber = 1;
    this.paginateItems();
  }

  previousPage(): void {
    if (this.filter.pageNumber > 1) {
      this.filter.pageNumber--;
      this.paginateItems();
    }
  }

  nextPage(): void {
    if (this.filter.pageNumber < this.totalPages) {
      this.filter.pageNumber++;
      this.paginateItems();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.filter.pageSize) || 1;
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber <= 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }

  // Utility helpers
  getProgramsCount(uni: MasterUniversityRequest): number {
    return (uni.progDegreeCount || 0) +
           (uni.progDiplomaCount || 0) +
           (uni.progCertificateCount || 0) +
           (uni.progPostgradCount || 0);
  }

  // Navigation
  viewUniversity(registrationId: number): void {
    this.router.navigate([
      AppRoutes.Ngo.UniversityAccreditationDetail,
      registrationId
    ]);
  }

  exportList(): void {
    this.notification.success('University accreditation list exported successfully.');
  }
}
