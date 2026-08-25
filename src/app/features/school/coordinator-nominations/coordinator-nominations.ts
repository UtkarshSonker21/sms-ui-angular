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
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { SCHOOL_STATUS_IDS } from '../../../core/constants/student-status.config';

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
  private studentStatusService = inject(StudentStatusService);

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

  statusOptions = this.studentStatusService.getStatusOptions(SCHOOL_STATUS_IDS);

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
    uFilter.pageSize = 0;
    uFilter.isActive = true;
    this.universityService.getMasterUniversities(uFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.universities = res.result.items;

          if (!this.universities.length) {
            this.notification.warning(
              'No universities are available.'
            );
          }
          return;
        }
        this.universities = [];
      },
      error: (error) => {
        this.universities = [];
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  getFaculties(universityId: number): void {
    const fFilter = new FacultyFilter();
    fFilter.pageNumber = 1;
    fFilter.pageSize = 0;
    fFilter.universityId = universityId;
    fFilter.isActive = true;
    this.facultyService.getFaculties(fFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.faculties = res.result.items;

          if (!this.faculties.length) {
            this.notification.warning(
              'No faculties are available for the selected university.'
            );
          }

          return;
        }
        this.faculties = [];
      },
      error: (error) => {
        this.faculties = [];
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  loadData(): void {
    this.filter.isActive = true;
    this.filter.studentStatusId = this.selectedStatus !== null ? this.selectedStatus : undefined;
    this.filter.universityId = this.selectedUniversity || undefined;
    (this.filter as any).facultyId = this.selectedFaculty || undefined;

    // Filter by coordinator's nominated students only
    const currentUser = this.currentUserProfileService.getCurrentUserProfile();
    if (currentUser && currentUser.loginId) {
      this.filter.myNominations = currentUser.loginId;
    }

    this.studentService.getStudents(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.students = response.result.items;
          this.totalRecords = response.result.totalCount;
          this.calculateKPIs(this.students);

          if (!this.students.length) {
            this.notification.warning(
              'No nominations found for the selected filters.'
            );
          }
          return;
        }

        this.students = [];
        this.totalRecords = 0;
      },
      error: (error) => {
        this.students = [];
        this.totalRecords = 0;
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  calculateKPIs(items: StudentRequest[]): void {

    this.kpiTotal = this.totalRecords;
    this.kpiInProcess = this.studentStatusService.count(items, StudentStatusEnum.AcceptanceInProcess);
    this.kpiSponsored = this.studentStatusService.count(items, StudentStatusEnum.Sponsored);
    this.kpiRegistered = this.studentStatusService.count(items, StudentStatusEnum.Registered);
    this.tabAccRejected = this.studentStatusService.count(items, StudentStatusEnum.AcceptanceRejected);

    // this.tabAll = this.totalRecords;
    // this.tabInProcess = this.kpiInProcess;
    // this.tabAccRejected = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.AcceptanceRejected).length;
    // this.tabSponsored = this.kpiSponsored;
    // this.tabSponRejected = items.filter(s => (s as any).studentStatusId === StudentStatusEnum.SponsoredRejected).length;
    // this.tabAwarded = items.filter(s => (s as any).studentApplicationStatusId === StudentStatusEnum.Awarded).length;
    // this.tabAwardedRejected = items.filter(s => (s as any).studentApplicationStatusId === StudentStatusEnum.AwardedRejected).length;
    // this.tabRegistered = this.kpiRegistered;
    // this.tabFailed = items.filter(s => (s as any).studentApplicationStatusId === StudentStatusEnum.Failed).length;
    // this.tabDismissed = items.filter(s => (s as any).studentApplicationStatusId === StudentStatusEnum.Dismissed).length;
    // this.tabGraduate = items.filter(s => (s as any).studentApplicationStatusId === StudentStatusEnum.Graduate).length;
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
    (this.filter as any).facultyId = undefined;
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
    (this.filter as any).facultyId = undefined;
    this.faculties = [];

    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedUniversityName(): string {
    const u = this.universities.find(x => x.universityId === this.selectedUniversity);
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
    (this.filter as any).facultyId = id || undefined;
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
    return this.studentStatusService.getBadgeClass(
      student.studentApplicationStatusId ?? StudentStatusEnum.Draft
    );
  }

  getStatusName(student: StudentRequest): string {
    return this.studentStatusService.getName(
      student.studentApplicationStatusId ?? StudentStatusEnum.Draft
    );
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
