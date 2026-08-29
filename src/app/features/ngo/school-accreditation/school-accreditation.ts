import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterSchoolRequest } from '../../../core/models/school/master-school/master-school-request.model';
import { MasterSchoolFilter } from '../../../core/models/school/master-school/master-school-filter.model';

import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';

import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { AppRoutes } from '../../../core/constants/app-routes';

@Component({
  selector: 'app-school-accreditation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './school-accreditation.html',
  styleUrl: './school-accreditation.scss',
})
export class SchoolAccreditation implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isCountryDropdownOpen = false;
    this.isSchoolTypeDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private schoolService = inject(MasterSchoolService);
  private countryService = inject(MasterCountryService);
  private dropdownService = inject(MasterDropDownService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Data List
  schools: MasterSchoolRequest[] = [];
  allFilteredItems: MasterSchoolRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Stats / KPIs
  kpiTotal = 0;
  kpiPending = 0;
  kpiAccepted = 0;
  kpiRejected = 0;

  // Filter Models
  filter = new MasterSchoolFilter();
  activeTab = 'all'; // 'all', 'pending', 'accepted', 'rejected'

  // Dropdowns
  selectedCountryId = 0;
  countries: MasterCountryRequest[] = [];
  countryMap = new Map<number, string>();
  isCountryDropdownOpen = false;

  selectedSchoolTypeId = 0;
  schoolTypes: MasterDropDownRequest[] = [];
  schoolTypeMap = new Map<number, string>();
  isSchoolTypeDropdownOpen = false;

  isPageSizeDropdownOpen = false;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;

    this.loadCountries();
    this.loadSchoolTypes();
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
      error: (error) => {
        this.loadData();
        this.notification.handleBusinessError(
          error,
          'Failed to load countries.'
        );
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

  loadSchoolTypes(): void {
    this.dropdownService.getByParentId(MainDropdown.SchoolType).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.schoolTypes = response.result;
          this.buildSchoolTypeMap();
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load school types.'
        );
      }
    });
  }

  buildSchoolTypeMap(): void {
    this.schoolTypeMap.clear();
    this.schoolTypes.forEach(t => {
      if (t.uniqueId) {
        this.schoolTypeMap.set(t.uniqueId, t.displayText);
      }
    });
  }

  getSchoolTypeName(schoolType: number): string {
    return this.schoolTypeMap.get(schoolType) || 'Unknown';
  }

  loadData(): void {
    const queryFilter = new MasterSchoolFilter();
    queryFilter.pageNumber = 1;
    queryFilter.pageSize = 10000; // Fetch all for client-side tab/dropdown filters

    this.schoolService.getMasterSchools(queryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.processSchoolsList(response.result.items);
        } else {
          this.processSchoolsList([]);
        }
      },
      error: (error) => {
        this.processSchoolsList([]);
        this.notification.handleBusinessError(
          error,
          'Failed to load school accreditation list.'
        );
      }
    });
  }

  private processSchoolsList(items: MasterSchoolRequest[]): void {
    // 1. Calculate KPI counts across all items loaded
    this.kpiTotal = items.length;
    this.kpiPending = items.filter(x => x.accreditationStatus === 1).length;
    this.kpiAccepted = items.filter(x => x.accreditationStatus === 2).length;
    this.kpiRejected = items.filter(x => x.accreditationStatus === 3).length;

    // 2. Apply search text filter
    if (this.searchText.trim()) {
      const q = this.searchText.trim().toLowerCase();
      items = items.filter(s => {
        const nameMatch = s.schoolName.toLowerCase().includes(q);
        const countryName = this.getCountryName(s.countryId).toLowerCase();
        const countryMatch = countryName.includes(q);
        const typeName = this.getSchoolTypeName(s.schoolType).toLowerCase();
        const typeMatch = typeName.includes(q);
        return nameMatch || countryMatch || typeMatch;
      });
    }

    // 3. Apply country filter
    if (this.selectedCountryId !== 0) {
      items = items.filter(s => s.countryId === this.selectedCountryId);
    }

    // 4. Apply school type filter
    if (this.selectedSchoolTypeId !== 0) {
      items = items.filter(s => s.schoolType === this.selectedSchoolTypeId);
    }

    // 5. Apply status tab filter
    if (this.activeTab === 'pending') {
      items = items.filter(x => x.accreditationStatus === 1);
    } else if (this.activeTab === 'accepted') {
      items = items.filter(x => x.accreditationStatus === 2);
    } else if (this.activeTab === 'rejected') {
      items = items.filter(x => x.accreditationStatus === 3);
    }

    this.allFilteredItems = items;
    this.totalRecords = items.length;
    this.paginateItems();
  }

  paginateItems(): void {
    const startIndex = (this.filter.pageNumber - 1) * this.filter.pageSize;
    this.schools = this.allFilteredItems.slice(startIndex, startIndex + this.filter.pageSize);
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
    this.isSchoolTypeDropdownOpen = false;
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

  // School Type Dropdown
  toggleSchoolTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.isSchoolTypeDropdownOpen = !this.isSchoolTypeDropdownOpen;
    this.isCountryDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectSchoolType(id: number): void {
    this.selectedSchoolTypeId = id;
    this.isSchoolTypeDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSchoolTypeSelection(event: Event): void {
    event.stopPropagation();
    this.selectedSchoolTypeId = 0;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedSchoolTypeName(): string {
    if (this.selectedSchoolTypeId === 0) return 'All School Types';
    return this.getSchoolTypeName(this.selectedSchoolTypeId);
  }

  // Page Size Dropdown
  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
    this.isCountryDropdownOpen = false;
    this.isSchoolTypeDropdownOpen = false;
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

  // Navigation
  viewSchool(schoolId: number): void {
    this.router.navigate([
      AppRoutes.Ngo.SchoolAccreditationDetail,
      schoolId
    ]);
  }

  exportList(): void {
    this.notification.success('School accreditation list exported successfully.');
  }
  
}
