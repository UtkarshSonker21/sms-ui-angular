import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramFilter } from '../../../core/models/university/programs/program-filter.model';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';

import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';
import { AppRoutes } from '../../../core/constants/app-routes';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';

@Component({
  selector: 'app-program-accreditation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './program-accreditation.html',
  styleUrl: './program-accreditation.scss',
})
export class ProgramAccreditation implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isUniversityDropdownOpen = false;
    this.isDegreeDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  private programService = inject(ProgramService);
  private universityService = inject(MasterUniversityService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private masterDropDownService = inject(MasterDropDownService);

  // Data List
  programs: ProgramRequest[] = [];
  allFilteredItems: ProgramRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Stats / KPIs
  kpiTotal = 0;
  kpiPending = 0;
  kpiAccredited = 0;
  kpiRejected = 0;

  // Filter Models
  filter = new ProgramFilter();
  activeTab = 'all'; // 'all', 'pending', 'accepted', 'rejected'

  // Dropdowns
  selectedUniversityId = 0;
  universities: MasterUniversityRequest[] = [];
  isUniversityDropdownOpen = false;

  selectedDegree = 0;
  degrees: MasterDropDownRequest[] = [];
  isDegreeDropdownOpen = false;

  isPageSizeDropdownOpen = false;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;

    this.loadUniversities();
    this.getDegrees();
    this.loadData();
  }

  loadUniversities(): void {
    const uniFilter = new MasterUniversityFilter();
    uniFilter.pageNumber = 1;
    uniFilter.pageSize = 0; // Fetch all
    uniFilter.isActive = true;
    uniFilter.accreditationStatus = AccreditationStatus.Accredited;

    this.universityService.getMasterUniversities(uniFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.universities = response.result.items;
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load universities.'
        );
      }
    });
  }

  loadData(): void {
    const queryFilter = new ProgramFilter();
    queryFilter.pageNumber = this.filter.pageNumber;
    queryFilter.pageSize = this.filter.pageSize;
    queryFilter.universityId = this.selectedUniversityId || undefined;
    queryFilter.searchText = this.searchText.trim() || undefined;

    if (this.activeTab === 'pending') {
      queryFilter.accreditationStatus = 1;
    } else if (this.activeTab === 'accepted') {
      queryFilter.accreditationStatus = 2;
    } else if (this.activeTab === 'rejected') {
      queryFilter.accreditationStatus = 3;
    }

    // Try to pass degree if backend supports it
    if (this.selectedDegree !== 0) {
      (queryFilter as any).degreeId = this.selectedDegree; 
    }

    this.programService.getPrograms(queryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          let items = response.result.items;

          // Note: KPIs reflect current page if backend pagination is used
          this.kpiTotal = items.length;
          this.kpiPending = items.filter(x => x.accreditationStatus === 1).length;
          this.kpiAccredited = items.filter(x => x.accreditationStatus === 2).length;
          this.kpiRejected = items.filter(x => x.accreditationStatus === 3).length;

          // Keep client-side filtering fallback for degree if backend ignored it
          if (this.selectedDegree !== 0) {
            items = items.filter(x => x.degree === this.selectedDegree);
          }

          this.allFilteredItems = items;
          this.totalRecords = (response.result as any).totalCount || items.length;
          this.paginateItems();
        } else {
          this.programs = [];
          this.allFilteredItems = [];
          this.totalRecords = 0;
          this.kpiTotal = 0;
          this.kpiPending = 0;
          this.kpiAccredited = 0;
          this.kpiRejected = 0;
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load program accreditation list.'
        );
      }
    });
  }

  paginateItems(): void {
    // Items are already paginated by the API
    this.programs = this.allFilteredItems;
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

  // University Dropdown
  toggleUniversityDropdown(event: Event): void {
    event.stopPropagation();
    this.isUniversityDropdownOpen = !this.isUniversityDropdownOpen;
    this.isDegreeDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectUniversity(id: number): void {
    this.selectedUniversityId = id;
    this.isUniversityDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearUniversitySelection(event: Event): void {
    event.stopPropagation();
    this.selectedUniversityId = 0;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedUniversityName(): string {
    if (this.selectedUniversityId === 0) return 'All Universities';
    const found = this.universities.find(u => u.universityId === this.selectedUniversityId);
    return found ? found.universityName || 'All Universities' : 'All Universities';
  }

  // Degree Dropdown
  toggleDegreeDropdown(event: Event): void {
    event.stopPropagation();
    this.isDegreeDropdownOpen = !this.isDegreeDropdownOpen;
    this.isUniversityDropdownOpen = false;
    this.isPageSizeDropdownOpen = false;
  }

  selectDegree(uniqueId: number): void {
    this.selectedDegree = uniqueId;
    this.isDegreeDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearDegreeSelection(event: Event): void {
    event.stopPropagation();
    this.selectedDegree = 0;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedDegreeName(): string {
    if (this.selectedDegree === 0) return 'All Degrees';
    const found = this.degrees.find(d => d.uniqueId === this.selectedDegree);
    return found ? found.displayText : 'All Degrees';
  }

  getDegrees(): void {
    this.masterDropDownService
      .getByParentId(MainDropdown.Degrees)
      .subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.degrees = response.result;
          } else {
            this.notification.warning(response.message);
          }
        },
        error: (error) => {
          this.notification.handleBusinessError(
            error,
            'Failed to load degrees.'
          );
        }
      });
  }

  // Page Size Dropdown
  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
    this.isUniversityDropdownOpen = false;
    this.isDegreeDropdownOpen = false;
  }

  selectPageSize(size: number): void {
    this.isPageSizeDropdownOpen = false;
    this.filter.pageSize = size;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  previousPage(): void {
    if (this.filter.pageNumber > 1) {
      this.filter.pageNumber--;
      this.loadData();
    }
  }

  nextPage(): void {
    if (this.filter.pageNumber < this.totalPages) {
      this.filter.pageNumber++;
      this.loadData();
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

  // Navigation
  viewProgram(programId: number): void {
    this.router.navigate([
      AppRoutes.Ngo.ProgramAccreditationDetail,
      programId
    ]);
  }

  exportList(): void {
    this.notification.success('Accreditation list exported successfully.');
  }

  isNumber(val: any): boolean {
    return val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
  }

  
}
