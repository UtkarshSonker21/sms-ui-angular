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
  schools: MasterSchoolRequest[] = [];
  specializations: MasterDropDownRequest[] = [];
  
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
    sFilter.pageSize = 1000;
    this.schoolService.getMasterSchools(sFilter).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.schools = res.result.items;
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
        }
      }
    });
  }

  loadData(): void {
    this.filter.isActive = true;
    this.filter.schoolId = this.selectedSchool || undefined;
    this.filter.studentStatusId = this.selectedStatus !== null ? this.selectedStatus : undefined;
    this.filter.hsSpecialization = (this.selectedSpec as any) || undefined;

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
        this.notification.error('Failed to load students.');
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

  viewStudent(id: number): void {
    this.router.navigate([AppRoutes.School.CoordinatorEditStudent, id]);
  }

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

}
