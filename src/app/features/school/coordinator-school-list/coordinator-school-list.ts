import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterSchoolRequest } from '../../../core/models/school/master-school/master-school-request.model';
import { MasterSchoolFilter } from '../../../core/models/school/master-school/master-school-filter.model';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-coordinator-school-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective, RouterModule, MatTooltipModule],
  templateUrl: './coordinator-school-list.html',
  styleUrl: './coordinator-school-list.scss',
})
export class CoordinatorSchoolList implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private schoolService = inject(MasterSchoolService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Table Data
  schools: MasterSchoolRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // KPI Summary
  kpiTotal = 0;
  kpiAccepted = 0;
  kpiPending = 0;
  kpiRejected = 0;

  // Tabs
  activeTab: number | string = 'all';

  // Filter
  filter: MasterSchoolFilter = new MasterSchoolFilter();

  isPageSizeDropdownOpen = false;

  accreditationStatusEnum = AccreditationStatus;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
  }

  loadData(): void {
    this.filter.isActive = true;
    this.filter.mySchools = true;
    this.schoolService.getMasterSchools(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.schools = response.result.items;
          this.totalRecords = response.result.totalCount;
          this.calculateKPIs(this.schools);
        } else {
          this.schools = [];
          this.notification.warning(response.message);
        }
      },
      error: () => {
        this.schools = [];
        this.notification.error('Failed to load schools.');
      }
    });
  }

  calculateKPIs(items: MasterSchoolRequest[]): void {
    this.kpiTotal = this.totalRecords;
    this.kpiAccepted = items.filter(s => s.accreditationStatus === AccreditationStatus.Accredited).length;
    this.kpiPending = items.filter(s => s.accreditationStatus === AccreditationStatus.Pending).length;
    this.kpiRejected = items.filter(s => s.accreditationStatus === AccreditationStatus.Rejected).length;
  }

  // --- Search & Filters ---
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

  setTab(tab: string | number): void {
    this.activeTab = tab;
    this.filter.accreditationStatus = tab === 'all' ? undefined : (tab as number);
    this.filter.pageNumber = 1;
    this.loadData();
  }

  // --- Status Badge Helper ---
  getStatusBadgeClass(school: MasterSchoolRequest): string {
    switch (school.accreditationStatus) {
      case AccreditationStatus.Accredited: return 'chip-registered';
      case AccreditationStatus.Pending: return 'chip-acceptance-process';
      case AccreditationStatus.Rejected: return 'chip-acceptance-rejected';
      default: return 'chip-draft';
    }
  }

  getStatusName(school: MasterSchoolRequest): string {
    switch (school.accreditationStatus) {
      case AccreditationStatus.Accredited: return 'Accredited';
      case AccreditationStatus.Pending: return 'Pending';
      case AccreditationStatus.Rejected: return 'Rejected';
      default: return 'Draft';
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


  isEdited(school: MasterSchoolRequest): boolean {
    // Enable Edit only when accreditation status is 0
    return (school.accreditationStatus === 0 && school.isDraft === false);
  }


  getEditTooltip(school: MasterSchoolRequest): string {
    if (school.isDraft) {
      return 'Draft schools cannot be edited.';
    }

    if (school.accreditationStatus === 2) {
      return 'Accredited schools cannot be edited.';
    }

    if (school.accreditationStatus === 1) {
      return 'School is currently under review.';
    }

    if (school.accreditationStatus === 3) {
      return 'Rejected school can be edited.';
    }

    return '';
  }

}
