import { ApiService } from '../../../core/services/common/api.service';
import { ApiResponse } from '../../../core/models/common/response/api-response.model';
import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { StudentCategoryService } from '../../../core/services/ngo/student-category.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';

import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';
import { StudentCategoryFilter } from '../../../core/models/ngo/student-category/student-category-filter.model';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { StudentCategoryRequest } from '../../../core/models/ngo/student-category/student-category.request.model';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { COMMITTEE_STATUS_IDS } from '../../../core/constants/student-status.config';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { StudentProgramApplicationFilter } from '../../../core/models/school/student-program-application/student-program-application-filter.model';

@Component({
  selector: 'app-ngo-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ngo-students.html',
  styleUrl: './ngo-students.scss',
})
export class NgoStudents implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isCountryDropdownOpen = false;
    this.isUniversityDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private api = inject(ApiService);
  private studentService = inject(StudentProgramService);
  private countryService = inject(MasterCountryService);
  private universityService = inject(MasterUniversityService);
  private studentCategoryService = inject(StudentCategoryService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private notification = inject(NotificationService);
  private studentStatusService = inject(StudentStatusService);
  private router = inject(Router);

  universityId: number = 0;

  // Currency
  selectedCurrency: 'KWD' | 'USD' | 'EUR' = 'KWD';
  ratesMap: Record<string, number> = {
    'USD': 1.0,
    'EUR': 0.8562,
    'GBP': 0.7459,
    'KWD': 0.3075,
    'INR': 93.191,
    'SOS': 570.0
  };

  // Table Data
  allStudents: StudentProgramApplication[] = [];
  students: StudentProgramApplication[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiAwarded = 0;
  kpiSponsored = 0;
  kpiDonor = 0;
  kpiRegistered = 0;
  kpiGraduated = 0;

  // Tab Counts
  tabRequestsCount = 0;
  tabAwardedCount = 0;
  tabSponsoredCount = 0;
  tabDonorCount = 0;
  tabRegisteredCount = 0;
  tabGraduatedCount = 0;
  tabRejectedCount = 0;

  activeTab: string = 'all';
  studentStatus = StudentStatusEnum;

  // Filter
  filter: StudentProgramApplicationFilter = new StudentProgramApplicationFilter();

  // Dropdown States & Data
  countries: MasterCountryRequest[] = [];
  universities: MasterUniversityRequest[] = [];
  categories: StudentCategoryRequest[] = [];

  statusOptions = this.studentStatusService.getStatusOptions(COMMITTEE_STATUS_IDS);

  selectedCountry: number = 0;
  selectedUniversity: number = 0;
  selectedCategory: number = 0;
  selectedStatus: number | null = StudentStatusEnum.Awarded;

  isCountryDropdownOpen = false;
  isUniversityDropdownOpen = false;
  isCategoryDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.getCountries();
    this.getUniversities();
    this.getCategories();
    this.loadRates();
    this.loadSummaryCounts();
    this.loadData();
  }

  selectCurrency(currency: 'KWD' | 'USD' | 'EUR'): void {
    this.selectedCurrency = currency;
  }

  getCountries(): void {
    const cFilter = new MasterCountryFilter();
    cFilter.pageNumber = 1;
    cFilter.pageSize = 1000;
    this.countryService.getMasterCountries(cFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.countries = res.result.items;
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(error, 'Failed to load countries.');
      }
    });
  }

  getUniversities(): void {
    const uFilter = new MasterUniversityFilter();
    uFilter.pageNumber = 1;
    uFilter.pageSize = 1000;
    uFilter.accreditationStatus = AccreditationStatus.Accredited;
    uFilter.countryId = this.selectedCountry || undefined;
    this.universityService.getMasterUniversities(uFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.universities = res.result.items;
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(error, 'Failed to load universities.');
      }
    });
  }

  getCategories(): void {
    const catFilter = new StudentCategoryFilter();
    catFilter.pageNumber = 1;
    catFilter.pageSize = 1000;
    catFilter.isActive = true;
    this.studentCategoryService.getStudentCategories(catFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.categories = res.result.items || [];
        }
      },
      error: (error) => {
        // Non-blocking
      }
    });
  }

  loadSummaryCounts(): void {
    const summaryFilter = new StudentProgramApplicationFilter();
    summaryFilter.pageNumber = 1;
    summaryFilter.pageSize = 1000;
    this.studentService.search(summaryFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.allStudents = res.result.items || [];
          this.calculateKPIs(this.allStudents);
        }
      }
    });
  }

  loadData(): void {
    this.filter.countryId = this.selectedCountry || undefined;
    this.filter.universityId = this.selectedUniversity || undefined;
    this.filter.studentCategoryId = this.selectedCategory || undefined;

    if (this.activeTab === 'donor') {
      this.filter.isDonorSponsored = true;
    } else {
      this.filter.isDonorSponsored = undefined;
    }

    this.filter.applicationStatusId = this.selectedStatus !== null ? this.selectedStatus : undefined;

    this.studentService.search(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.students = response.result.items;
          this.totalRecords = response.result.totalCount;

          if (this.allStudents.length === 0) {
            this.allStudents = [...this.students];
            this.calculateKPIs(this.allStudents);
          }
        } else {
          this.students = [];
          this.notification.warning(response.message);
        }
      },
      error: (error) => {
        this.students = [];
        this.notification.handleBusinessError(error, 'Failed to load NGO students.');
      }
    });
  }

  calculateKPIs(items: StudentProgramApplication[]): void {
    this.tabAwardedCount = this.studentStatusService.counts(items as any, StudentStatusEnum.Awarded);
    this.tabSponsoredCount = this.studentStatusService.counts(items as any, StudentStatusEnum.Sponsored);
    this.tabRegisteredCount = this.studentStatusService.counts(items as any, StudentStatusEnum.Registered);
    this.tabGraduatedCount = this.studentStatusService.counts(items as any, StudentStatusEnum.Graduated);
    this.tabRejectedCount =
      this.studentStatusService.counts(items as any, StudentStatusEnum.SponsoringRejected) +
      this.studentStatusService.counts(items as any, StudentStatusEnum.AcceptanceRejected);
    this.tabRequestsCount =
      this.tabAwardedCount +
      this.studentStatusService.counts(items as any, StudentStatusEnum.SponsoringInProcess);
    this.tabDonorCount = items.filter(x => !!x.donorName || !!x.donorCode || x.sponsorshipSource === 'Donor').length;

    this.kpiAwarded = this.tabAwardedCount;
    this.kpiSponsored = this.tabSponsoredCount;
    this.kpiDonor = this.tabDonorCount;
    this.kpiRegistered = this.tabRegisteredCount;
    this.kpiGraduated = this.tabGraduatedCount;
  }

  setCategoryTab(tab: string): void {
    this.activeTab = tab;
    this.filter.pageNumber = 1;
    switch (tab) {
      case 'requests':
        this.selectedStatus = StudentStatusEnum.Awarded;
        break;
      case 'all':
        this.selectedStatus = StudentStatusEnum.Awarded;
        break;
      case 'sponsored':
        this.selectedStatus = StudentStatusEnum.Sponsored;
        break;
      case 'donor':
        this.selectedStatus = null;
        break;
      case 'enrolled':
        this.selectedStatus = StudentStatusEnum.Registered;
        break;
      case 'graduated':
        this.selectedStatus = StudentStatusEnum.Graduated;
        break;
      case 'rejected':
        this.selectedStatus = StudentStatusEnum.SponsoringRejected;
        break;
      default:
        this.selectedStatus = null;
        break;
    }
    this.loadData();
  }

  // --- Search & Filters ---
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

  // --- Dropdowns ---
  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
    this.isUniversityDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
  }

  selectCountryOption(id: number): void {
    this.selectedCountry = id;
    this.selectedUniversity = 0;
    this.filter.pageNumber = 1;
    this.getUniversities();
    this.loadData();
  }

  clearCountrySelection(event: Event): void {
    event.stopPropagation();
    this.selectedCountry = 0;
    this.selectedUniversity = 0;
    this.isCountryDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.getUniversities();
    this.loadData();
  }

  getSelectedCountryName(): string {
    const c = this.countries.find(x => x.countryId === this.selectedCountry);
    return c ? c.countryName : '';
  }

  toggleUniversityDropdown(event: Event): void {
    event.stopPropagation();
    this.isUniversityDropdownOpen = !this.isUniversityDropdownOpen;
    this.isCountryDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
  }

  selectUniversityOption(id: number): void {
    this.selectedUniversity = id;
    this.isUniversityDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearUniversitySelection(event: Event): void {
    event.stopPropagation();
    this.selectedUniversity = 0;
    this.isUniversityDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedUniversityName(): string {
    const u = this.universities.find(x => x.universityId === this.selectedUniversity);
    return u ? u.universityName : '';
  }

  toggleCategoryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
    this.isCountryDropdownOpen = false;
    this.isUniversityDropdownOpen = false;
  }

  selectCategoryOption(id: number): void {
    this.selectedCategory = id;
    this.isCategoryDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearCategorySelection(event: Event): void {
    event.stopPropagation();
    this.selectedCategory = 0;
    this.isCategoryDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedCategoryName(): string {
    const cat = this.categories.find(x => x.studentCategoryId === this.selectedCategory);
    return cat ? cat.categoryName : '';
  }

  // --- Status & Journey Helpers ---
  getStatusBadgeClass(student: StudentProgramApplication): string {
    const st = student.applicationStatusId;
    switch (st) {
      case StudentStatusEnum.Awarded: return 'st-awarded';
      case StudentStatusEnum.Sponsored: return 'st-sponsored';
      case StudentStatusEnum.Registered: return 'st-registered';
      case StudentStatusEnum.Graduated: return 'st-graduated';
      case StudentStatusEnum.SponsoringRejected:
      case StudentStatusEnum.AcceptanceRejected:
        return 'st-rejected';
      case StudentStatusEnum.AcceptanceInProcess:
      case StudentStatusEnum.SponsoringInProcess:
      case StudentStatusEnum.AwardingInProcess:
        return 'st-process';
      case StudentStatusEnum.Accepted:
        return 'st-accepted';
      default:
        return 'st-process';
    }
  }

  getJourneyDots(statusId?: number): { cls: string; title: string }[] {
    if (statusId === StudentStatusEnum.AcceptanceRejected || statusId === StudentStatusEnum.SponsoringRejected) {
      return [{ cls: 'rej', title: 'Rejected' }];
    }
    const stages = [
      { id: StudentStatusEnum.AcceptanceInProcess, title: 'In Process' },
      { id: StudentStatusEnum.Accepted, title: 'Accepted' },
      { id: StudentStatusEnum.Awarded, title: 'Awarded' },
      { id: StudentStatusEnum.Sponsored, title: 'Sponsored' },
      { id: StudentStatusEnum.Registered, title: 'Registered' },
      { id: StudentStatusEnum.Graduated, title: 'Graduated' },
    ];

    let currentIdx = stages.findIndex(s => s.id === statusId);
    if (statusId === StudentStatusEnum.SponsoringInProcess) {
      currentIdx = 2; // In awarding/sponsorship transition
    }
    if (currentIdx === -1) currentIdx = 0;

    return stages.map((s, idx) => ({
      title: s.title,
      cls: idx < currentIdx ? 'done' : (idx === currentIdx ? 'cur' : '')
    }));
  }

  // --- Pagination ---
  get totalPages(): number {
    return Math.ceil(this.totalRecords / (this.filter.pageSize || 25));
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber === 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }

  previousPage(): void {
    if (!this.isPreviousDisabled) {
      if (this.filter.pageNumber) this.filter.pageNumber--;
      this.loadData();
    }
  }

  nextPage(): void {
    if (!this.isNextDisabled) {
      if (this.filter.pageNumber) this.filter.pageNumber++;
      this.loadData();
    }
  }

  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
  }

  selectPageSize(size: number): void {
    this.filter.pageSize = size;
    this.filter.pageNumber = 1;
    this.isPageSizeDropdownOpen = false;
    this.loadData();
  }

  loadRates(): void {
    this.api.get<ApiResponse<any[]>>('superadmin/currency-conversion/latest-rates').subscribe({
      next: (res) => {
        if (res.success && res.result && Array.isArray(res.result)) {
          res.result.forEach((item: any) => {
            if (item.currencyCode && item.rates) {
              this.ratesMap[item.currencyCode.toUpperCase()] = Number(item.rates);
            }
          });
        }
      },
      error: () => {
        // Fallback default conversion rates active
      }
    });
  }

  convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    if (!amount || isNaN(amount) || fromCurrency === toCurrency) return amount;
    const fromRate = this.ratesMap[fromCurrency.toUpperCase()] || 1.0;
    const toRate = this.ratesMap[toCurrency.toUpperCase()] || 1.0;
    const inBaseUsd = amount / fromRate;
    return inBaseUsd * toRate;
  }

  formatTotalCost(student: StudentProgramApplication): string {
    if (student.totalProgramCost == null || isNaN(student.totalProgramCost) || student.totalProgramCost <= 0) {
      return '-';
    }
    const fromCur = student.programCurrency || 'USD';
    const converted = this.convertAmount(student.totalProgramCost, fromCur, this.selectedCurrency);
    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formatted} ${this.selectedCurrency}`;
  }

  exportCsv(): void {
    const rows = this.students;
    if (!rows || rows.length === 0) {
      this.notification.warning('No student records to export.');
      return;
    }
    const head = [
      'Student ID',
      'Country',
      'University',
      'College',
      'Program',
      'Student Name',
      'Category',
      'Sponsorship Source',
      'Donor Name',
      'Donor Reference',
      'Total Program Cost',
      'Status',
      'Action Date'
    ];
    const lines = [head.join(',')];
    rows.forEach(s => {
      lines.push([
        s.studentCode || ('#' + s.studentId),
        s.universityCountryName || '',
        s.universityName || '',
        s.facultyName || '',
        s.programName || '',
        s.fullName || '',
        s.sponsorshipCategoryName || s.categoryName || '',
        s.sponsorshipSource || '',
        s.donorName || '',
        s.donorCode || '',
        this.formatTotalCost(s),
        s.applicationStatusName || '',
        s.actionDate ? new Date(s.actionDate).toISOString().split('T')[0] : ''
      ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kafaat-students.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.notification.success('Student roster exported to CSV successfully.');
  }

  viewStudent(student: StudentProgramApplication): void {
    const targetId = student.applicationId || student.studentId;
    if (student.applicationStatusId === StudentStatusEnum.Registered) {
      this.router.navigate(['/registered-student', targetId]);
    } else {
      this.router.navigate(['/ngo-student-details', targetId]);
    }
  }

  photoErrors = new Set<number>();

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  handlePhotoError(studentId: number): void {
    if (studentId) {
      this.photoErrors.add(studentId);
    }
  }

  hasPhotoError(studentId: number): boolean {
    return this.photoErrors.has(studentId);
  }
}
