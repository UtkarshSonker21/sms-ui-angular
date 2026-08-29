import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramFilter } from '../../../core/models/university/programs/program-filter.model';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { FacultyService } from '../../../core/services/university/faculty.service';
import { FacultyFilter } from '../../../core/models/university/faculties/faculty-filter.model';
import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { AppRoutes } from '../../../core/constants/app-routes';

@Component({
  selector: 'app-programs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './programs-list.html',
  styleUrl: './programs-list.scss',
})
export class ProgramsList implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isFacultyDropdownOpen = false;
  }

  private programService = inject(ProgramService);
  private facultyService = inject(FacultyService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  goBack(): void {
    this.router.navigate([AppRoutes.University.Faculties]);
  }

  programs: ProgramRequest[] = [];
  totalRecords = 0;
  searchText = '';

  filter = new ProgramFilter();

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;

    this.getFaculties();
    this.loadData();
  }

  loadData(): void {
    this.filter.isActive = true;
    this.filter.facultyId = this.selectedFaculty || undefined;

    this.programService.getPrograms(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.programs = response.result.items;
          this.totalRecords = response.result.totalCount;
          return;
        }
        this.programs = [];
        this.notification.warning(response.message || 'Failed to load programs.');
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

  isPageSizeDropdownOpen = false;

  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
  }

  selectPageSize(size: number): void {
    this.isPageSizeDropdownOpen = false;
    this.onPageSizeChange(size);
  }

  onPageSizeChange(size: number): void {
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
    return Math.ceil(this.totalRecords / this.filter.pageSize);
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber <= 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }

  selectedFaculty = 0;
  faculties: FacultyRequest[] = [];
  isFacultyDropdownOpen = false;

  toggleFacultyDropdown(event: Event): void {
    event.stopPropagation();
    this.isFacultyDropdownOpen = !this.isFacultyDropdownOpen;
  }

  selectFacultyOption(facultyId: number | undefined): void {
    this.selectedFaculty = facultyId || 0;
    this.isFacultyDropdownOpen = false;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearFacultySelection(event: Event): void {
    event.stopPropagation();
    this.selectedFaculty = 0;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  getSelectedFacultyName(): string {
    if (this.selectedFaculty === 0) {
      return 'All Faculties';
    }
    const found = this.faculties.find(f => f.facultyId === this.selectedFaculty);
    return found ? found.facultyName : 'All Faculties';
  }

  getFaculties(): void {
    const filter = new FacultyFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;
    filter.isActive = true;

    this.facultyService.getFaculties(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.faculties = response.result.items;
          return;
        }
        this.faculties = [];
        this.notification.warning(response.message || 'Failed to load faculties.');
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

  openEditProgram(program: ProgramRequest): void {
    this.router.navigate([AppRoutes.University.ProgramDetail, program.programId]);
  }

  programToDelete?: ProgramRequest;
  showDeleteModal = false;
  modalErrorMessage = '';

  openDeleteProgramModal(program: ProgramRequest): void {
    this.programToDelete = program;
    this.showDeleteModal = true;
    this.modalErrorMessage = '';
  }

  confirmDeleteProgram(): void {
    if (!this.programToDelete?.programId) {
      return;
    }

    this.programService.deleteProgram(this.programToDelete.programId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Program deleted successfully');
          this.showDeleteModal = false;
          this.loadData();

          return;
        }
        this.notification.error(response.message || 'Failed to delete progrma.');
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to delete program.'
        );
      }
    });
  }
}
