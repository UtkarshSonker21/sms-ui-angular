import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { FacultyService } from '../../../core/services/university/faculty.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';

import { FacultyFilter } from '../../../core/models/university/faculties/faculty-filter.model';
import { ProgramFilter } from '../../../core/models/university/programs/program-filter.model';
import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { UNIVERSITY_STATUS_IDS } from '../../../core/constants/student-status.config';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { StudentProgramApplicationFilter } from '../../../core/models/school/student-program-application/student-program-application-filter.model';

@Component({
  selector: 'app-university-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './university-students.html',
  styleUrl: './university-students.scss',
})
export class UniversityStudents implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isFacultyDropdownOpen = false;
    this.isProgramDropdownOpen = false;
    this.isStatusDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private studentService = inject(StudentProgramService);
  private facultyService = inject(FacultyService);
  private programService = inject(ProgramService);
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
  tabAccepted = 0;
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
  faculties: FacultyRequest[] = [];
  programs: ProgramRequest[] = [];

  statusOptions = this.studentStatusService.getStatusOptions(UNIVERSITY_STATUS_IDS);

  selectedFaculty: number = 0;
  selectedProgram: number = 0;
  selectedStatus: number | null = null;

  isFacultyDropdownOpen = false;
  isProgramDropdownOpen = false;
  isStatusDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  ngOnInit(): void {
    // this.universityId = this.currentUserProfileService.getCurrentUserProfile().universityId || 0;
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.getFaculties();
    this.getPrograms();
    this.loadData();
  }

  getFaculties(): void {
    const fFilter = new FacultyFilter();
    fFilter.pageNumber = 1;
    fFilter.pageSize = 1000;
    fFilter.universityId = this.universityId || undefined;
    this.facultyService.getFaculties(fFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.faculties = res.result.items;
          return;
        }
        this.faculties = [];
      },
      error: (error) => {
        this.faculties = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load faculties.'
        );
      }
    });
  }

  getPrograms(): void {
    const pFilter = new ProgramFilter();
    pFilter.pageNumber = 1;
    pFilter.pageSize = 1000;
    pFilter.universityId = this.universityId || undefined;
    pFilter.facultyId = this.selectedFaculty || undefined;
    this.programService.getPrograms(pFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.programs = res.result.items;
          return;
        }
        this.programs = [];
      },
      error: (error) => {
        this.programs = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load programs.'
        );
      }
    });
  }

  isDataLoaded = false;
  allStudents: StudentProgramApplication[] = [];
  filteredStudents: StudentProgramApplication[] = [];

  loadData(): void {
    if (!this.isDataLoaded) {
      const fetchFilter = new StudentProgramApplicationFilter();
      fetchFilter.pageNumber = 1;
      fetchFilter.pageSize = 100000;
      fetchFilter.universityId = this.universityId || undefined;

      this.studentService.search(fetchFilter).subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.allStudents = response.result.items || [];
            this.calculateKPIs(this.allStudents);
            this.isDataLoaded = true;
            this.applyLocalFilters();
          } else {
            this.allStudents = [];
            this.filteredStudents = [];
          }
        },
        error: (error) => {
          this.allStudents = [];
          this.filteredStudents = [];
          this.notification.handleBusinessError(error, 'Failed to load students.');
        }
      });
    } else {
      this.applyLocalFilters();
    }
  }

  applyLocalFilters(): void {
    let result = this.allStudents;

    if (this.selectedFaculty) {
      result = result.filter(s => s.facultyId === this.selectedFaculty);
    }
    if (this.selectedProgram) {
      result = result.filter(s => s.programId === this.selectedProgram);
    }
    if (this.selectedStatus !== null) {
      result = result.filter(s => s.applicationStatusId === this.selectedStatus || s.applicationStatus === this.selectedStatus);
    }
    if (this.filter.searchText) {
      const term = this.filter.searchText.trim().toLowerCase();
      result = result.filter(s => 
        (s.fullName && s.fullName.toLowerCase().includes(term)) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
        (s.programName && s.programName.toLowerCase().includes(term)) ||
        (s.universityName && s.universityName.toLowerCase().includes(term))
      );
    }

    this.totalRecords = result.length;

    const start = (this.filter.pageNumber - 1) * this.filter.pageSize;
    const end = start + this.filter.pageSize;
    this.filteredStudents = result.slice(start, end);
    this.students = this.filteredStudents; // Keep this in sync just in case
  }

  calculateKPIs(items: StudentProgramApplication[]): void {

    this.kpiTotal = items.length;
    this.kpiInProcess = this.studentStatusService.counts(items as any, StudentStatusEnum.AcceptanceInProcess);
    this.kpiSponsored = this.studentStatusService.counts(items as any, StudentStatusEnum.Sponsored);
    this.kpiRegistered = this.studentStatusService.counts(items as any, StudentStatusEnum.Registered);
    
    this.tabAll = items.length;
    this.tabInProcess = this.kpiInProcess;
    this.tabAccepted = this.studentStatusService.counts(items as any, StudentStatusEnum.Accepted);
    this.tabAccRejected = this.studentStatusService.counts(items as any, StudentStatusEnum.AcceptanceRejected);
    this.tabAwarded = this.studentStatusService.counts(items as any, StudentStatusEnum.Awarded);
    this.tabSponsored = this.kpiSponsored;
    this.tabRegistered = this.kpiRegistered;
    this.tabGraduate = this.studentStatusService.counts(items as any, StudentStatusEnum.Graduated);
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
  toggleFacultyDropdown(event: Event): void {
    event.stopPropagation();
    this.isFacultyDropdownOpen = !this.isFacultyDropdownOpen;
    this.isProgramDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectFacultyOption(id: number): void {
    this.selectedFaculty = id;
    this.selectedProgram = 0;
    this.filter.pageNumber = 1;
    this.getPrograms();
    this.loadData();
  }

  clearFacultySelection(event: Event): void {
    event.stopPropagation();
    this.selectedFaculty = 0;
    this.selectedProgram = 0;
    this.isFacultyDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.getPrograms();
    this.loadData();
  }

  getSelectedFacultyName(): string {
    const f = this.faculties.find(x => x.facultyId === this.selectedFaculty);
    return f ? f.facultyName : '';
  }

  toggleProgramDropdown(event: Event): void {
    event.stopPropagation();
    this.isProgramDropdownOpen = !this.isProgramDropdownOpen;
    this.isFacultyDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectProgramOption(id: number): void {
    this.selectedProgram = id;
    this.isProgramDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearProgramSelection(event: Event): void {
    event.stopPropagation();
    this.selectedProgram = 0;
    this.isProgramDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedProgramName(): string {
    const p = this.programs.find(x => x.programId === this.selectedProgram);
    return p ? p.programName : '';
  }

  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    this.isFacultyDropdownOpen = false;
    this.isProgramDropdownOpen = false;
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
    const statusId = student.applicationStatusId ?? StudentStatusEnum.Draft;
    return this.studentStatusService.getBadgeClass(statusId);
  }

  getBadgeClassForStatus(statusId: number): string {
    return this.studentStatusService.getBadgeClass(statusId);
  }

  getStatusName(student: StudentProgramApplication): string {
    return this.studentStatusService.getName(
      student.applicationStatusId ?? StudentStatusEnum.Draft
    );
  }

  getStatusDateInfo(student: StudentProgramApplication): { label: string, date: Date | undefined } {
    const statusId = student.applicationStatus || student.applicationStatusId;
    let label = 'Status Date';
    let dateField = 'actionDate'; // Fallback to actionDate since individual dates are not exposed yet

    switch (statusId) {
      case StudentStatusEnum.Sponsored:
        label = 'Sponsored Date';
        break;
      case StudentStatusEnum.Awarded:
        label = 'Awarded Date';
        break;
      case StudentStatusEnum.Registered:
        label = 'Registered Date';
        break;
      case StudentStatusEnum.AcceptanceInProcess:
        label = 'Acceptance in Process Date';
        break;
      case StudentStatusEnum.AcceptanceRejected:
        label = 'Acceptance Rejected Date';
        break;
      case StudentStatusEnum.SponsoringInProcess:
        label = 'Sponsoring in Process Date';
        break;
      case StudentStatusEnum.SponsoringRejected:
        label = 'Sponsoring Rejected Date';
        break;
      case StudentStatusEnum.AwardingInProcess:
        label = 'Awarding in Process Date';
        break;
      case StudentStatusEnum.AwardingRejected:
        label = 'Awarding Rejected Date';
        break;
      case StudentStatusEnum.Failed:
        label = 'Failed Date';
        break;
      case StudentStatusEnum.Dismissed:
        label = 'Dismissed Date';
        break;
      case StudentStatusEnum.Graduated:
        label = 'Graduated Date';
        break;
      default:
        label = 'Action Date';
        break;
    }

    return {
      label: label,
      date: (student as any)[dateField]
    };
  }

  // --- Photo Handling ---
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

  viewStudent(studentId: number): void {
    const student = this.students.find(x => x.studentId === studentId);
    if (student) {
      if (student.applicationStatusId === StudentStatusEnum.Registered) {
        this.router.navigate(['/registered-student', student.applicationId]);
      } else {
        this.router.navigate(['/university-student-details', student.applicationId]);
      }
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
