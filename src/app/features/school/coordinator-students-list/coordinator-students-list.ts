import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { StudentService } from '../../../core/services/school/student.service';
import { StudentRequest } from '../../../core/models/school/students/student-request.model';
import { StudntFilter } from '../../../core/models/school/students/student-filter.model';
import { AppRoutes } from '../../../core/constants/app-routes';

@Component({
  selector: 'app-coordinator-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coordinator-students-list.html',
  styleUrl: './coordinator-students-list.scss',
})
export class CoordinatorStudentsList implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isSchoolDropdownOpen = false;
    this.isSpecDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private studentService = inject(StudentService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // ── Data ──────────────────────────────────────────────────────────
  students: StudentRequest[] = [];
  allFilteredItems: StudentRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // ── KPIs (derived from status tabs) ───────────────────────────────
  kpiTotal = 0;
  kpiInProcess = 0;
  kpiAcceptanceRejected = 0;
  kpiSponsored = 0;
  kpiSponsoredRejected = 0;
  kpiAwardedRejected = 0;
  kpiRegistered = 0;
  kpiFailed = 0;
  kpiDismissed = 0;
  kpiGraduate = 0;

  // ── Status tabs ────────────────────────────────────────────────────
  readonly STATUS_TABS = [
    { key: 'all', label: 'All', dot: '' },
    { key: 'Acceptance in process', label: 'Acceptance in process', dot: 'var(--da-gold)' },
    { key: 'Acceptance rejected', label: 'Acceptance rejected', dot: 'var(--da-danger)' },
    { key: 'Sponsored', label: 'Sponsored', dot: 'var(--da-green)' },
    { key: 'Sponsored rejected', label: 'Sponsored rejected', dot: '#991B1B' },
    { key: 'Awarded rejected', label: 'Awarded rejected', dot: '#6D28D9' },
    { key: 'Registered', label: 'Registered', dot: 'var(--da-green-700, #15803D)' },
    { key: 'Failed', label: 'Failed', dot: '#EA580C' },
    { key: 'Dismissed', label: 'Dismissed', dot: '#4B5563' },
    { key: 'Graduate', label: 'Graduate', dot: 'var(--da-muted)' },
  ];
  activeTab = 'all';

  // ── Filter models ─────────────────────────────────────────────────
  filter = new StudntFilter();

  // ── School dropdown ───────────────────────────────────────────────
  selectedSchool = '';
  schools: string[] = [];
  isSchoolDropdownOpen = false;

  // ── Specialization dropdown ───────────────────────────────────────
  selectedSpec = '';
  specializations: string[] = [];
  isSpecDropdownOpen = false;

  // ── Page-size dropdown ────────────────────────────────────────────
  isPageSizeDropdownOpen = false;

  // ──────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
  }

  loadData(): void {
    const queryFilter = new StudntFilter();
    queryFilter.pageNumber = 1;
    queryFilter.pageSize = 10000;
    queryFilter.searchText = this.searchText.trim() || undefined;
    // queryFilter.school = this.selectedSchool || undefined;
    // queryFilter.hsSpecialization = this.selectedSpec || undefined;

    this.studentService.getStudents(queryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.processStudentList(response.result.items);
        } else {
          this.processStudentList([]);
        }
      },
      error: () => {
        this.processStudentList([]);
        this.notification.error('Failed to load students list.');
      }
    });
  }

  private processStudentList(items: StudentRequest[]): void {
    // 1. Derive school & spec lists from the raw payload
    // this.buildFilterOptions(items);

    // 2. Compute KPIs over the complete (unfiltered by tab) set
    this.kpiTotal = items.length;
    this.kpiInProcess = 0;
    this.kpiAcceptanceRejected = 0;
    this.kpiSponsored = 0;
    this.kpiSponsoredRejected = 0;
    this.kpiAwardedRejected = 0;
    this.kpiRegistered = 0;
    this.kpiFailed = 0;
    this.kpiDismissed = 0;
    this.kpiGraduate = 0;

    // 3. Apply active tab filter
    if (this.activeTab !== 'all') {
      // filtering by studentStatus has been removed as the property no longer exists
    }

    this.allFilteredItems = items;
    this.totalRecords = items.length;
    this.paginateItems();
  }

  // private buildFilterOptions(items: StudentRequest[]): void {
  //   const schoolSet = new Set<string>();
  //   const specSet   = new Set<string>();
  //   items.forEach(s => {
  //     if (s.school) schoolSet.add(s.school);
  //     if (s.hsSpecialization) specSet.add(s.hsSpecialization);
  //   });
  //   // Only update if lists changed (avoid re-rendering dropdowns mid-filter)
  //   if (this.schools.length === 0) {
  //     this.schools = Array.from(schoolSet).sort();
  //   }
  //   if (this.specializations.length === 0) {
  //     this.specializations = Array.from(specSet).sort();
  //   }
  // }

  paginateItems(): void {
    const startIndex = (this.filter.pageNumber - 1) * this.filter.pageSize;
    this.students = this.allFilteredItems.slice(startIndex, startIndex + this.filter.pageSize);
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

  // ── Tabs ──────────────────────────────────────────────────────────
  setTab(tab: string): void {
    this.activeTab = tab;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getTabCount(key: string): number {
    if (key === 'all') return this.kpiTotal;
    if (key === 'Acceptance in process') return this.kpiInProcess;
    if (key === 'Acceptance rejected') return this.kpiAcceptanceRejected;
    if (key === 'Sponsored') return this.kpiSponsored;
    if (key === 'Sponsored rejected') return this.kpiSponsoredRejected;
    if (key === 'Awarded rejected') return this.kpiAwardedRejected;
    if (key === 'Registered') return this.kpiRegistered;
    if (key === 'Failed') return this.kpiFailed;
    if (key === 'Dismissed') return this.kpiDismissed;
    if (key === 'Graduate') return this.kpiGraduate;
    return 0;
  }

  // ── School Dropdown ───────────────────────────────────────────────
  toggleSchoolDropdown(event: Event): void {
    event.stopPropagation();
    this.isSchoolDropdownOpen = !this.isSchoolDropdownOpen;
    this.isSpecDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectSchool(value: string): void {
    this.selectedSchool = value;
    this.isSchoolDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSchoolSelection(event: Event): void {
    event.stopPropagation();
    this.selectedSchool = '';
    this.filter.pageNumber = 1;
    this.loadData();
  }

  // ── Specialization Dropdown ───────────────────────────────────────
  toggleSpecDropdown(event: Event): void {
    event.stopPropagation();
    this.isSpecDropdownOpen = !this.isSpecDropdownOpen;
    this.isSchoolDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectSpec(value: string): void {
    this.selectedSpec = value;
    this.isSpecDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSpecSelection(event: Event): void {
    event.stopPropagation();
    this.selectedSpec = '';
    this.filter.pageNumber = 1;
    this.loadData();
  }

  // ── Page Size Dropdown ────────────────────────────────────────────
  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
    this.isSchoolDropdownOpen = false;
    this.isSpecDropdownOpen = false;
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

  // ── Student avatar ────────────────────────────────────────────────
  getInitials(student: StudentRequest): string {
    const first = (student.firstName || '').charAt(0).toUpperCase();
    const last = (student.lastName || '').charAt(0).toUpperCase();
    return first + last || 'ST';
  }

  getFullName(student: StudentRequest): string {
    return [student.firstName, student.secondName, student.lastName]
      .filter(Boolean)
      .join(' ');
  }

  // ── Status chip class ─────────────────────────────────────────────
  getStatusChipClass(status: string): string {
    switch (status) {
      case 'Acceptance in process': return 'chip chip-pending';
      case 'Acceptance rejected': return 'chip chip-rejected';
      case 'Sponsored': return 'chip chip-sponsored';
      case 'Sponsored rejected': return 'chip chip-rejected';
      case 'Awarded rejected': return 'chip chip-rejected';
      case 'Registered': return 'chip chip-registered';
      case 'Failed': return 'chip chip-rejected';
      case 'Dismissed': return 'chip chip-graduated';
      case 'Graduate': return 'chip chip-graduated';
      default: return 'chip chip-pending';
    }
  }

  getStatusDotColor(status: string): string {
    switch (status) {
      case 'Acceptance in process': return 'var(--da-gold)';
      case 'Acceptance rejected': return 'var(--da-danger)';
      case 'Sponsored': return 'var(--da-green)';
      case 'Sponsored rejected': return '#991B1B';
      case 'Awarded rejected': return '#6D28D9';
      case 'Registered': return 'var(--da-green-700, #15803D)';
      case 'Failed': return '#EA580C';
      case 'Dismissed': return '#4B5563';
      case 'Graduate': return 'var(--da-muted)';
      default: return 'var(--da-muted)';
    }
  }

  // ── Navigation ────────────────────────────────────────────────────
  viewStudent(studentId: number): void {
    this.router.navigate([AppRoutes.School.EditStudent, studentId]);
  }

  addStudent(): void {
    this.router.navigate([AppRoutes.School.AddStudent]);
  }


  exportList(): void {
    this.notification.success('Students list exported successfully.');
  }

}
