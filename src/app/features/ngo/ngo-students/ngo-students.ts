import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';

import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { UNIVERSITY_STATUS_IDS } from '../../../core/constants/student-status.config';
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
    this.isStatusDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private studentService = inject(StudentProgramService);
  private countryService = inject(MasterCountryService);
  private universityService = inject(MasterUniversityService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private notification = inject(NotificationService);
  private studentStatusService = inject(StudentStatusService);
  private router = inject(Router);

  universityId: number = 0;

  // Table Data
  students: StudentProgramApplication[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiTotal = 0;
  kpiInProcess = 0;
  kpiSponsored = 0;
  kpiRegistered = 0;

  // Tab Counts
  tabAll = 0;
  tabInProcess = 0;
  tabAccRejected = 0;
  tabSponsored = 0;
  tabSponRejected = 0;
  tabAwarded = 0;
  tabAwardedRejected = 0;
  tabRegistered = 0;
  tabFailed = 0;
  tabDismissed = 0;
  tabGraduate = 0;

  activeTab: number | string = 'all';
  studentStatus = StudentStatusEnum;

  // Filter
  filter: StudentProgramApplicationFilter = new StudentProgramApplicationFilter();

  // Dropdown States & Data
  countries: MasterCountryRequest[] = [];
  universities: MasterUniversityRequest[] = [];
  
  // NOTE: If there are NGO specific statuses later, we can update this constant.
  statusOptions = this.studentStatusService.getStatusOptions(UNIVERSITY_STATUS_IDS);
  
  selectedCountry: number = 0;
  selectedUniversity: number = 0;
  selectedStatus: number | null = null;

  isCountryDropdownOpen = false;
  isUniversityDropdownOpen = false;
  isStatusDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  ngOnInit(): void {
    // this.universityId = this.currentUserProfileService.getCurrentUserProfile().universityId || 0;
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.getCountries();
    this.getUniversities();
    this.loadData();
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
      }
    });
  }

  loadData(): void {
    this.filter.countryId = this.selectedCountry || undefined;
    this.filter.universityId = this.selectedUniversity || undefined;
    this.filter.applicationStatusId = this.selectedStatus !== null ? this.selectedStatus : undefined;

    this.studentService.search(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.students = response.result.items;
          this.totalRecords = response.result.totalCount;
          this.calculateKPIs(this.students);
        } else {
          this.students = [];
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.students = [];
        this.notification.error('Failed to load students.');
      }
    });
  }

  calculateKPIs(items: StudentProgramApplication[]): void {
    this.kpiTotal = this.totalRecords;
    this.kpiInProcess = this.studentStatusService.counts(items as any, StudentStatusEnum.AcceptanceInProcess);
    this.kpiSponsored = this.studentStatusService.counts(items as any, StudentStatusEnum.Sponsored);
    this.kpiRegistered = this.studentStatusService.counts(items as any, StudentStatusEnum.Registered);
    this.tabAccRejected = this.studentStatusService.counts(items as any, StudentStatusEnum.AcceptanceRejected);
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
    this.isStatusDropdownOpen = false;
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
    this.isStatusDropdownOpen = false;
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
    const u = this.universities.find(x => x.registrationId === this.selectedUniversity);
    return u ? u.universityName : '';
  }

  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    this.isCountryDropdownOpen = false;
    this.isUniversityDropdownOpen = false;
  }

  selectStatusOption(id: number | null): void {
    this.selectedStatus = id;
    this.activeTab = id === null ? 'all' : id;
    this.isStatusDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearStatusSelection(event: Event): void {
    event.stopPropagation();
    this.selectedStatus = null;
    this.isStatusDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedStatusName(): string {
    if (this.selectedStatus === null) return 'All Statuses';
    const s = this.statusOptions.find(x => x.id === this.selectedStatus);
    return s ? s.name : '';
  }

  setTab(tab: string | number): void {
    this.activeTab = tab;
    this.selectedStatus = tab === 'all' ? null : (tab as number);
    this.filter.pageNumber = 1;
    this.loadData();
  }

  // --- Status Badge Helper ---
  getStatusBadgeClass(student: StudentProgramApplication): string {
    return this.studentStatusService.getBadgeClass(
      student.applicationStatusId ?? StudentStatusEnum.Draft
    );
  }

  getStatusName(student: StudentProgramApplication): string {
    return this.studentStatusService.getName(
      student.applicationStatusId ?? StudentStatusEnum.Draft
    );
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
      if(this.filter.pageNumber) this.filter.pageNumber--;
      this.loadData();
    }
  }

  nextPage(): void {
    if (!this.isNextDisabled) {
      if(this.filter.pageNumber) this.filter.pageNumber++;
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

  exportList(): void {
    this.notification.info('Export functionality coming soon.');
  }

  viewStudent(studentId: number): void {
    const student = this.students.find(x => x.studentId === studentId);
    if (student) {
      this.router.navigate(['/ngo-student-details', student.applicationId]);
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
