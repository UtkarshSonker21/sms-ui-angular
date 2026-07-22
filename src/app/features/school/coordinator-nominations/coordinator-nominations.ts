import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentService } from '../../../core/services/school/student.service';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { FacultyService } from '../../../core/services/university/faculty.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';

import { StudentRequest } from '../../../core/models/school/students/student-request.model';
import { StudntFilter } from '../../../core/models/school/students/student-filter.model';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';
import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { FacultyFilter } from '../../../core/models/university/faculties/faculty-filter.model';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { AppRoutes } from '../../../core/constants/app-routes';

@Component({
  selector: 'app-coordinator-nominations',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './coordinator-nominations.html',
  styleUrl: './coordinator-nominations.scss',
})
export class CoordinatorNominations implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isUniversityDropdownOpen = false;
    this.isFacultyDropdownOpen = false;
    this.isStatusDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private studentService = inject(StudentService);
  private universityService = inject(MasterUniversityService);
  private facultyService = inject(FacultyService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private currentUserProfileService = inject(CurrentUserProfileService);

  // Table Data
  students: StudentRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiTotal = 0;
  kpiInProcess = 0;
  kpiSponsored = 0;
  kpiRegistered = 0;

  // Tab Counts (for internal use/calculations if needed)
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
  filter: StudntFilter = new StudntFilter();

  // Dropdown States & Data
  universities: MasterUniversityRequest[] = [];
  faculties: FacultyRequest[] = [];
  
  statusOptions = [
    { id: StudentStatusEnum.Draft, name: 'Draft' },
    { id: StudentStatusEnum.AcceptanceInProcess, name: 'Acceptance In Process' },
    { id: StudentStatusEnum.AcceptanceRejected, name: 'Acceptance Rejected' },
    { id: StudentStatusEnum.Sponsored, name: 'Sponsored' },
    { id: StudentStatusEnum.SponsoredRejected, name: 'Sponsored Rejected' },
    { id: StudentStatusEnum.Awarded, name: 'Sponsored' },
    { id: StudentStatusEnum.AwardedRejected, name: 'Awarded Rejected' },
    { id: StudentStatusEnum.Registered, name: 'Registered' },
    { id: StudentStatusEnum.Failed, name: 'Failed' },
    { id: StudentStatusEnum.Dismissed, name: 'Dismissed' },
    { id: StudentStatusEnum.Graduate, name: 'Graduate' },
  ];
  
  selectedUniversity: number = 0;
  selectedFaculty: number = 0;
  selectedStatus: number | null = null;

  isUniversityDropdownOpen = false;
  isFacultyDropdownOpen = false;
  isStatusDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.getUniversities();
    this.loadData();
  }

  getUniversities(): void {
    const uFilter = new MasterUniversityFilter();
    uFilter.pageNumber = 1;
    uFilter.pageSize = 1000;
    uFilter.isActive = true;
    uFilter.isDraft = false;
    this.universityService.getMasterUniversities(uFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.universities = res.result.items;
        }
      }
    });
  }

  getFaculties(universityId: number): void {
    const fFilter = new FacultyFilter();
    fFilter.pageNumber = 1;
    fFilter.pageSize = 1000;
    fFilter.universityId = universityId;
    fFilter.isActive = true;
    this.facultyService.getFaculties(fFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.faculties = res.result.items;
        }
      }
    });
  }

  loadData(): void {
    this.filter.isActive = true;
    this.filter.studentStatusId = this.selectedStatus !== null ? this.selectedStatus : undefined;
    this.filter.universityId = this.selectedUniversity || undefined;
    this.filter.facultyId = this.selectedFaculty || undefined;

    // Filter by coordinator's nominated students only
    const currentUser = this.currentUserProfileService.getCurrentUserProfile();
    if (currentUser && currentUser.loginId) {
      this.filter.createdBy = currentUser.loginId;
    }

    this.studentService.getStudents(this.filter).subscribe({
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
        this.notification.error('Failed to load nominations.');
      }
    });
  }

  calculateKPIs(items: StudentRequest[]): void {
    this.kpiTotal = this.totalRecords;
    this.kpiInProcess = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.AcceptanceInProcess).length;
    this.kpiSponsored = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.Sponsored).length;
    this.kpiRegistered = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.Registered).length;

    this.tabAll = this.totalRecords;
    this.tabInProcess = this.kpiInProcess;
    this.tabAccRejected = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.AcceptanceRejected).length;
    this.tabSponsored = this.kpiSponsored;
    this.tabSponRejected = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.SponsoredRejected).length;
    this.tabAwarded = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.Awarded).length;
    this.tabAwardedRejected = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.AwardedRejected).length;
    this.tabRegistered = this.kpiRegistered;
    this.tabFailed = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.Failed).length;
    this.tabDismissed = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.Dismissed).length;
    this.tabGraduate = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.Graduate).length;
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
  toggleUniversityDropdown(event: Event): void {
    event.stopPropagation();
    this.isUniversityDropdownOpen = !this.isUniversityDropdownOpen;
    this.isFacultyDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectUniversityOption(id: number): void {
    this.selectedUniversity = id;
    this.filter.universityId = id || undefined;
    this.isUniversityDropdownOpen = false;

    // Clear selected faculty
    this.selectedFaculty = 0;
    this.filter.facultyId = undefined;
    this.faculties = [];
    if (id !== 0) {
      this.getFaculties(id);
    }

    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearUniversitySelection(event: Event): void {
    event.stopPropagation();
    this.selectedUniversity = 0;
    this.filter.universityId = undefined;
    this.isUniversityDropdownOpen = false;

    // Clear selected faculty
    this.selectedFaculty = 0;
    this.filter.facultyId = undefined;
    this.faculties = [];

    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedUniversityName(): string {
    const u = this.universities.find(x => x.registrationId === this.selectedUniversity);
    return u ? u.universityName : '';
  }

  toggleFacultyDropdown(event: Event): void {
    event.stopPropagation();
    if (this.selectedUniversity === 0) return;
    this.isFacultyDropdownOpen = !this.isFacultyDropdownOpen;
    this.isUniversityDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectFacultyOption(id: number): void {
    this.selectedFaculty = id;
    this.filter.facultyId = id || undefined;
    this.isFacultyDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearFacultySelection(event: Event): void {
    event.stopPropagation();
    this.selectedFaculty = 0;
    this.filter.facultyId = undefined;
    this.isFacultyDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedFacultyName(): string {
    const f = this.faculties.find(x => x.facultyId === this.selectedFaculty);
    return f ? f.facultyName : '';
  }

  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    this.isUniversityDropdownOpen = false;
    this.isFacultyDropdownOpen = false;
  }

  selectStatusOption(id: number | null): void {
    this.selectedStatus = id;
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
  getStatusBadgeClass(student: StudentRequest): string {
    switch(student.studentApplicationStatusId) {
      case StudentStatusEnum.Draft: return 'chip-draft';
      case StudentStatusEnum.AcceptanceInProcess: return 'chip-acceptance-process';
      case StudentStatusEnum.AcceptanceRejected: return 'chip-acceptance-rejected';
      case StudentStatusEnum.Sponsored: return 'chip-sponsored';
      case StudentStatusEnum.SponsoredRejected: return 'chip-sponsored-rejected';
      case StudentStatusEnum.Awarded: return 'chip-awarded';
      case StudentStatusEnum.AwardedRejected: return 'chip-awarded-rejected';
      case StudentStatusEnum.Registered: return 'chip-registered';
      case StudentStatusEnum.Failed: return 'chip-failed';
      case StudentStatusEnum.Dismissed: return 'chip-dismissed';
      case StudentStatusEnum.Graduate: return 'chip-graduate';
      default: return 'chip-draft';
    }
  }

  getStatusName(student: StudentRequest): string {
    switch(student.studentApplicationStatusId) {
      case StudentStatusEnum.Draft: return 'Draft';
      case StudentStatusEnum.AcceptanceInProcess: return 'Acceptance In Process';
      case StudentStatusEnum.AcceptanceRejected: return 'Acceptance Rejected';
      case StudentStatusEnum.Sponsored: return 'Sponsored';
      case StudentStatusEnum.SponsoredRejected: return 'Sponsored Rejected';
      case StudentStatusEnum.Awarded: return 'Awarded';
      case StudentStatusEnum.AwardedRejected: return 'Awarded Rejected';
      case StudentStatusEnum.Registered: return 'Registered';
      case StudentStatusEnum.Failed: return 'Failed';
      case StudentStatusEnum.Dismissed: return 'Dismissed';
      case StudentStatusEnum.Graduate: return 'Graduate';
      default: return 'Not Assigned';
    }
  }

  // --- Pagination ---
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.filter.pageSize);
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber === 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }

  previousPage(): void {
    if (!this.isPreviousDisabled) {
      this.filter.pageNumber--;
      this.loadData();
    }
  }

  nextPage(): void {
    if (!this.isNextDisabled) {
      this.filter.pageNumber++;
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

  addStudent(): void {
    this.router.navigate([AppRoutes.School.CoordinatorAddStudent]);
  }

  studentList(): void {
    this.router.navigate([AppRoutes.School.CoordinatorStudents]);
  }

  viewStudent(id: number): void {
    this.router.navigate([AppRoutes.School.CoordinatorEditStudent, id]);
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
