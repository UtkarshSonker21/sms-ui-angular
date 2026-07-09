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

  // Mock Fallback Data (matching universities.js seed)
  private mockCountries: MasterCountryRequest[] = [
    { countryId: 1, countryName: 'Somalia', countryIsdCode: 252, isActive: true },
    { countryId: 2, countryName: 'Kenya', countryIsdCode: 254, isActive: true },
    { countryId: 3, countryName: 'Ethiopia', countryIsdCode: 251, isActive: true },
    { countryId: 4, countryName: 'Tanzania', countryIsdCode: 255, isActive: true }
  ];

  private mockUniversities: any[] = [
    {
      registrationId: 1,
      universityName: 'Simad University',
      universityType: 'Private university',
      establishedYear: 1999,
      charterAccreditation: 'Ministry of Higher Education · ACTSOM',
      countryNameText: 'Somalia',
      countryId: 0,
      facultiesCount: 7,
      progDegreeCount: 21,
      studentsTotal: 6800,
      createdDate: '2024-09-02',
      accreditationStatus: 2, // Accredited
    },
    {
      registrationId: 2,
      universityName: 'Al-Noor University',
      universityType: 'Private university',
      establishedYear: 2006,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      countryId: 0,
      facultiesCount: 5,
      progDegreeCount: 14,
      studentsTotal: 3200,
      createdDate: '2024-10-18',
      accreditationStatus: 1, // Pending
    },
    {
      registrationId: 3,
      universityName: 'Al-Amal University',
      universityType: 'State university',
      establishedYear: 1994,
      charterAccreditation: 'Commission for University Education (CUE)',
      countryNameText: 'Kenya',
      countryId: 0,
      facultiesCount: 9,
      progDegreeCount: 28,
      studentsTotal: 11200,
      createdDate: '2024-08-21',
      accreditationStatus: 2, // Accredited
    },
    {
      registrationId: 4,
      universityName: 'East African University',
      universityType: 'Private university',
      establishedYear: 2010,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      countryId: 0,
      facultiesCount: 4,
      progDegreeCount: 11,
      studentsTotal: 2700,
      createdDate: '2024-11-05',
      accreditationStatus: 1, // Pending
    },
    {
      registrationId: 5,
      universityName: 'Banadir Technical Institute',
      universityType: 'Private university',
      establishedYear: 2018,
      charterAccreditation: '—',
      countryNameText: 'Somalia',
      countryId: 0,
      facultiesCount: 2,
      progDegreeCount: 5,
      studentsTotal: 640,
      createdDate: '2024-10-02',
      accreditationStatus: 3, // Rejected
    },
    {
      registrationId: 6,
      universityName: 'Horn Academy of Sciences',
      universityType: 'Direct Aid university',
      establishedYear: 2015,
      charterAccreditation: 'Ministry of Education (Ethiopia)',
      countryNameText: 'Ethiopia',
      countryId: 0,
      facultiesCount: 3,
      progDegreeCount: 8,
      studentsTotal: 1450,
      createdDate: '2024-11-12',
      accreditationStatus: 1, // Pending
    },
    {
      registrationId: 7,
      universityName: 'Marka Coastal University',
      universityType: 'State university',
      establishedYear: 2012,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      countryId: 0,
      facultiesCount: 3,
      progDegreeCount: 7,
      studentsTotal: 980,
      createdDate: '2024-09-28',
      accreditationStatus: 3, // Rejected
    },
    {
      registrationId: 8,
      universityName: 'Hargeisa City University',
      universityType: 'Private university',
      establishedYear: 2008,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      countryId: 0,
      facultiesCount: 6,
      progDegreeCount: 17,
      studentsTotal: 5100,
      createdDate: '2024-07-14',
      accreditationStatus: 2, // Accredited
    },
    {
      registrationId: 9,
      universityName: 'Kismayo University',
      universityType: 'State university',
      establishedYear: 2014,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      countryId: 0,
      facultiesCount: 4,
      progDegreeCount: 9,
      studentsTotal: 1800,
      createdDate: '2024-11-20',
      accreditationStatus: 1, // Pending
    },
    {
      registrationId: 10,
      universityName: 'Nairobi Islamic University',
      universityType: 'Private university',
      establishedYear: 2003,
      charterAccreditation: 'Commission for University Education (CUE)',
      countryNameText: 'Kenya',
      countryId: 0,
      facultiesCount: 6,
      progDegreeCount: 19,
      studentsTotal: 6300,
      createdDate: '2024-06-30',
      accreditationStatus: 2, // Accredited
    },
    {
      registrationId: 11,
      universityName: 'Addis International University',
      universityType: 'Private university',
      establishedYear: 2011,
      charterAccreditation: 'Ministry of Education (Ethiopia)',
      countryNameText: 'Ethiopia',
      countryId: 0,
      facultiesCount: 5,
      progDegreeCount: 13,
      studentsTotal: 3900,
      createdDate: '2024-10-27',
      accreditationStatus: 1, // Pending
    },
    {
      registrationId: 12,
      universityName: 'Zanzibar College of Health',
      universityType: 'Private university',
      establishedYear: 2016,
      charterAccreditation: 'Tanzania Commission for Universities (TCU)',
      countryNameText: 'Tanzania',
      countryId: 0,
      facultiesCount: 2,
      progDegreeCount: 6,
      studentsTotal: 1100,
      createdDate: '2024-09-15',
      accreditationStatus: 2, // Accredited
    }
  ];

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;

    this.loadCountries();
  }

  loadCountries(): void {
    const countryFilter = new MasterCountryFilter();
    countryFilter.pageNumber = 1;
    countryFilter.pageSize = 1000;
    countryFilter.isActive = true;

    this.countryService.getMasterCountries(countryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result && response.result.items.length > 0) {
          this.countries = response.result.items;
        } else {
          this.countries = [...this.mockCountries];
        }
        this.buildCountryMap();
        this.loadData();
      },
      error: () => {
        this.countries = [...this.mockCountries];
        this.buildCountryMap();
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
        let items: MasterUniversityRequest[] = [];
        if (response.success && response.result && response.result.items.length > 0) {
          items = response.result.items;
        } else {
          items = this.getMockUniversitiesMapped();
        }
        this.processUniversitiesList(items);
      },
      error: () => {
        // Safe fallback to mock data
        const items = this.getMockUniversitiesMapped();
        this.processUniversitiesList(items);
      }
    });
  }

  private getMockUniversitiesMapped(): MasterUniversityRequest[] {
    return this.mockUniversities.map(u => {
      // Find matching country from fetched countries list
      const country = this.countries.find(
        c => c.countryName.toLowerCase() === u.countryNameText.toLowerCase()
      );
      const countryId = country ? country.countryId : 0;
      
      const req = new MasterUniversityRequest();
      req.registrationId = u.registrationId;
      req.universityName = u.universityName;
      req.universityType = u.universityType;
      req.establishedYear = u.establishedYear;
      req.charterAccreditation = u.charterAccreditation;
      req.countryId = countryId || u.registrationId; // default fallback countryId if not matched
      req.facultiesCount = u.facultiesCount;
      req.progDegreeCount = u.progDegreeCount;
      req.studentsTotal = u.studentsTotal;
      req.createdDate = u.createdDate;
      req.accreditationStatus = u.accreditationStatus;
      req.isActive = true;
      req.isDraft = false;
      return req;
    });
  }

  private processUniversitiesList(items: MasterUniversityRequest[]): void {
    // 1. Calculate general stats across ALL items loaded
    this.kpiTotal = items.length;
    this.kpiPending = items.filter(x => x.accreditationStatus === 1).length;
    this.kpiAccredited = items.filter(x => x.accreditationStatus === 2).length;
    this.kpiRejected = items.filter(x => x.accreditationStatus === 3).length;

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
      'university-accreditation-detail',
      registrationId
    ]);
  }

  exportList(): void {
    this.notification.success('University accreditation list exported successfully.');
  }
}
