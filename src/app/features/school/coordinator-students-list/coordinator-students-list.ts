import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentService } from '../../../core/services/school/student.service';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';

import { StudentRequest } from '../../../core/models/school/students/student-request.model';
import { StudntFilter } from '../../../core/models/school/students/student-filter.model';
import { MasterSchoolRequest } from '../../../core/models/school/master-school/master-school-request.model';
import { MasterSchoolFilter } from '../../../core/models/school/master-school/master-school-filter.model';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { AppRoutes } from '../../../core/constants/app-routes';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { SCHOOL_STATUS_IDS } from '../../../core/constants/student-status.config';


@Component({
  selector: 'app-coordinator-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './coordinator-students-list.html',
  styleUrl: './coordinator-students-list.scss',
})
export class CoordinatorStudentsList implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isSchoolDropdownOpen = false;
    this.isSpecDropdownOpen = false;
    this.isStatusDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private studentService = inject(StudentService);
  private schoolService = inject(MasterSchoolService);
  private masterDropdownService = inject(MasterDropDownService);
  private notification = inject(NotificationService);
  private studentStatusService = inject(StudentStatusService);
  private router = inject(Router);

  // Table Data
  students: StudentRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiTotal = 0;
  kpiInProcess = 0;
  kpiSponsored = 0;
  kpiRegistered = 0;

  // Tab Counts
  tabAll = 0;
  tabDraft = 0;
  tabInProcess = 0;
  tabAccRejected = 0;
  tabAwarded = 0;
  tabAwardedRejected = 0;
  tabSponsored = 0;
  tabSponRejected = 0;
  tabRegistered = 0;
  tabFailed = 0;
  tabGraduated = 0;
  tabGraduate = 0; // Keeping both in case Graduate is used in template

  activeTab: number | string = 'all';
  studentStatus = StudentStatusEnum;

  // Filter
  filter: StudntFilter = new StudntFilter();

  // Dropdown States & Data
  schools: MasterSchoolRequest[] = [];
  specializations: MasterDropDownRequest[] = [];


  statusOptions = this.studentStatusService.getStatusOptions(SCHOOL_STATUS_IDS);

  selectedSchool: number = 0;
  selectedSpec: string = '';
  selectedStatus: number | null = null;

  isSchoolDropdownOpen = false;
  isSpecDropdownOpen = false;
  isStatusDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.getSchools();
    this.getSpecializations();
    this.loadData();
  }

  getSchools(): void {
    const sFilter = new MasterSchoolFilter();
    sFilter.pageNumber = 1;
    sFilter.pageSize = 0;
    this.schoolService.getMasterSchools(sFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.schools = res.result.items;
          if (!this.schools.length) {
            this.notification.warning(
              'No schools are available.'
            );
          }
          return;
        }
        this.schools = [];
      },
      error: (error) => {
        this.schools = [];
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  getSpecializations(): void {
    // ParentId 1 used as a placeholder for HS Specialization if applicable
    this.masterDropdownService.getByParentId(MainDropdown.HighSchoolDivision).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.specializations = res.result;

          if (!this.specializations.length) {
            this.notification.warning(
              'No specializations are available.'
            );
          }
          return;
        }
        this.specializations = [];
      },
      error: (error) => {
        this.specializations = [];
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
  }

  isDataLoaded = false;
  allStudents: StudentRequest[] = [];
  filteredStudents: StudentRequest[] = [];

  loadData(): void {
    if (!this.isDataLoaded) {
      const fetchFilter = new StudntFilter();
      fetchFilter.pageNumber = 1;
      fetchFilter.pageSize = 100000;
      fetchFilter.isActive = true;
      fetchFilter.schoolId = this.filter.schoolId || undefined;

      this.studentService.getStudents(fetchFilter).subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.allStudents = response.result.items || [];
            this.calculateKPIs(this.allStudents);
            this.isDataLoaded = true;
            this.applyLocalFilters();
          } else {
            this.allStudents = [];
            this.filteredStudents = [];
            this.notification.warning(response.message || 'Failed to load students.');
          }
        },
        error: (error) => {
          this.allStudents = [];
          this.filteredStudents = [];
          if (this.notification.handleBusinessError(error)) {
            return;
          }
        }
      });
    } else {
      this.applyLocalFilters();
    }
  }

  applyLocalFilters(): void {
    let result = this.allStudents;

    if (this.selectedSchool) {
      result = result.filter(s => s.schoolId === this.selectedSchool);
    }
    if (this.selectedSpec) {
      result = result.filter(s => s.hsSpecialization === this.selectedSpec);
    }
    if (this.selectedStatus !== null) {
      result = result.filter(s => s.studentApplicationStatusId === this.selectedStatus);
    }
    if (this.filter.searchText) {
      const term = this.filter.searchText.trim().toLowerCase();
      result = result.filter(s => 
        (s.fullName && s.fullName.toLowerCase().includes(term)) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) || 
        (s.phone && s.phone.toLowerCase().includes(term))
      );
    }

    this.totalRecords = result.length;

    const start = (this.filter.pageNumber - 1) * this.filter.pageSize;
    const end = start + this.filter.pageSize;
    this.filteredStudents = result.slice(start, end);
    this.students = this.filteredStudents;
  }

  calculateKPIs(items: StudentRequest[]): void {

    this.kpiTotal = items.length;
    this.kpiInProcess = this.studentStatusService.count(items, StudentStatusEnum.AcceptanceInProcess);
    this.kpiSponsored = this.studentStatusService.count(items, StudentStatusEnum.Sponsored);
    this.kpiRegistered = this.studentStatusService.count(items, StudentStatusEnum.Registered);

    this.tabAll = items.length;
    this.tabDraft = this.studentStatusService.count(items, StudentStatusEnum.Draft);
    this.tabInProcess = this.kpiInProcess;
    this.tabAccRejected = this.studentStatusService.count(items, StudentStatusEnum.AcceptanceRejected);
    this.tabAwarded = this.studentStatusService.count(items, StudentStatusEnum.Awarded);
    this.tabAwardedRejected = this.studentStatusService.count(items, StudentStatusEnum.AwardingRejected);
    this.tabSponsored = this.kpiSponsored;
    this.tabSponRejected = this.studentStatusService.count(items, StudentStatusEnum.SponsoringRejected);
    this.tabRegistered = this.kpiRegistered;
    this.tabFailed = this.studentStatusService.count(items, StudentStatusEnum.Failed);
    this.tabGraduate = this.studentStatusService.count(items, StudentStatusEnum.Graduated);

  }

  getBadgeClassForStatus(statusId: number): string {
    return this.studentStatusService.getBadgeClass(statusId);
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
  toggleSchoolDropdown(event: Event): void {
    event.stopPropagation();
    this.isSchoolDropdownOpen = !this.isSchoolDropdownOpen;
    this.isSpecDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectSchoolOption(id: number): void {
    this.selectedSchool = id;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSchoolSelection(event: Event): void {
    event.stopPropagation();
    this.selectedSchool = 0;
    this.isSchoolDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedSchoolName(): string {
    const s = this.schools.find(x => x.schoolId === this.selectedSchool);
    return s ? s.schoolName : '';
  }

  toggleSpecDropdown(event: Event): void {
    event.stopPropagation();
    this.isSpecDropdownOpen = !this.isSpecDropdownOpen;
    this.isSchoolDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectSpecOption(specName: string): void {
    this.selectedSpec = specName;
    this.isSpecDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSpecSelection(event: Event): void {
    event.stopPropagation();
    this.selectedSpec = '';
    this.isSpecDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    this.isSchoolDropdownOpen = false;
    this.isSpecDropdownOpen = false;
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



}
