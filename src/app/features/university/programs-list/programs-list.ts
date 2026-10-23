import { Component, inject, OnInit, HostListener } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramFilter } from '../../../core/models/university/programs/program-filter.model';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramSemester } from '../../../core/models/university/programs/program-semester.model';
import { AcademicCalendarResponse } from '../../../core/models/university/academic-calendar/academic-calendar-response.model';
import { AcademicCalendarService } from '../../../core/services/university/academic-calendar.service';
import { FacultyService } from '../../../core/services/university/faculty.service';
import { FacultyFilter } from '../../../core/models/university/faculties/faculty-filter.model';
import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { AppRoutes } from '../../../core/constants/app-routes';
import { ThemedDatePickerComponent } from '../../../shared/components/themed-date-picker/themed-date-picker';

@Component({
  selector: 'app-programs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule, ScrollingModule, DisableAutocompleteDirective, ThemedDatePickerComponent],
  templateUrl: './programs-list.html',
  styleUrl: './programs-list.scss',
})
export class ProgramsList implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isFacultyDropdownOpen = false;
    this.isSemesterCalendarDropdownOpen = false;
  }

  private programService = inject(ProgramService);
  private academicCalendarService = inject(AcademicCalendarService);
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

  programForSemesterConfirmation?: ProgramRequest;
  programSemesters: ProgramSemester[] = [];
  academicCalendars: AcademicCalendarResponse[] = [];
  selectedAcademicCalendarId: number | null = null;
  showSemesterModal = false;
  isLoadingSemesters = false;
  isSavingSemesters = false;
  semesterModalError = '';
  isSemesterCalendarDropdownOpen = false;
  semesterCalendarDropdownWidth = 0;
  readonly semesterCalendarDropdownPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  openConfirmProgramSemesters(program: ProgramRequest): void {
    if (!program.programId) return;

    this.programForSemesterConfirmation = program;
    this.programSemesters = [];
    this.academicCalendars = [];
    this.selectedAcademicCalendarId = null;
    this.semesterModalError = '';
    this.showSemesterModal = true;
    this.isLoadingSemesters = true;

    this.academicCalendarService.getCalendarsByUniversity(program.universityId).subscribe({
      next: response => {
        if (!response.success || !response.result) {
          this.semesterModalError = response.message || 'Unable to load university academic calendars.';
          return;
        }
        this.academicCalendars = response.result
          .filter(calendar => calendar.universityId === program.universityId)
          .sort((a, b) => b.periodStartDate.localeCompare(a.periodStartDate));
        if (this.academicCalendars.length === 0)
          this.semesterModalError = 'Configure an academic calendar before generating program semester dates.';
      },
      error: error => {
        this.semesterModalError = error?.error?.message || 'Unable to load university academic calendars.';
        this.notification.handleBusinessError(error, 'Failed to load academic calendars.');
      }
    });

    this.programService.getSemesterByProgramId(program.programId).subscribe({
      next: response => {
        this.isLoadingSemesters = false;
        const existing = Array.isArray(response.result) ? response.result : [];
        const byNumber = new Map(existing.map(item => [item.semesterNo, item]));
        this.programSemesters = Array.from(
          { length: Math.max(0, program.numberOfSemesters || 0) },
          (_, index) => {
            const semesterNo = index + 1;
            const saved = byNumber.get(semesterNo);
            return {
              programSemesterId: saved?.programSemesterId ?? 0,
              semesterNo,
              semesterName: saved?.semesterName || `Semester ${semesterNo}`,
              academicTermId: saved?.academicTermId ?? null,
              academicCalendarId: saved?.academicCalendarId ?? null,
              academicYearName: saved?.academicYearName ?? null,
              termSequence: saved?.termSequence ?? null,
              termName: saved?.termName ?? null,
              startDate: this.toDateInput(saved?.startDate),
              endDate: this.toDateInput(saved?.endDate),
              registrationStartDate: this.toDateInput(saved?.registrationStartDate),
              registrationEndDate: this.toDateInput(saved?.registrationEndDate)
            };
          }
        );
      },
      error: error => {
        this.isLoadingSemesters = false;
        this.semesterModalError = error?.error?.message || 'Failed to load program semesters.';
        this.notification.handleBusinessError(error, 'Failed to load program semesters.');
      }
    });
  }

  loadSemesterDefaults(academicCalendarId: number | null): void {
    this.isSemesterCalendarDropdownOpen = false;
    const programId = this.programForSemesterConfirmation?.programId;
    this.selectedAcademicCalendarId = academicCalendarId;
    if (academicCalendarId == null) {
      this.semesterModalError = '';
      this.programSemesters = this.programSemesters.map(semester => ({
        ...semester,
        semesterName: `Semester ${semester.semesterNo}`,
        academicTermId: null,
        academicCalendarId: null,
        academicYearName: null,
        termSequence: null,
        termName: null,
        startDate: null,
        endDate: null,
        registrationStartDate: null,
        registrationEndDate: null
      }));
      return;
    }
    if (!programId) return;

    this.isLoadingSemesters = true;
    this.semesterModalError = '';
    this.programService.getProgramSemesterDefaults(programId, academicCalendarId).subscribe({
      next: response => {
        this.isLoadingSemesters = false;
        if (!response.success || !response.result) {
          this.semesterModalError = response.message || 'Unable to generate semester defaults.';
          return;
        }
        this.programSemesters = response.result.map(item => ({
          ...item,
          startDate: this.toDateInput(item.startDate),
          endDate: this.toDateInput(item.endDate),
          registrationStartDate: this.toDateInput(item.registrationStartDate),
          registrationEndDate: this.toDateInput(item.registrationEndDate)
        }));
      },
      error: error => {
        this.isLoadingSemesters = false;
        this.semesterModalError = error?.error?.message || 'Unable to generate semester defaults.';
        this.notification.handleBusinessError(error, 'Failed to generate semester defaults.');
      }
    });
  }

  saveConfirmedSemesters(): void {
    const programId = this.programForSemesterConfirmation?.programId;
    if (!programId || !this.selectedAcademicCalendarId || this.isSavingSemesters) return;

    this.semesterModalError = this.validateProgramSemesters();
    if (this.semesterModalError) return;

    this.isSavingSemesters = true;
    this.programService.saveProgramSemesters(programId, this.programSemesters, this.selectedAcademicCalendarId).subscribe({
      next: response => {
        this.isSavingSemesters = false;
        if (!response.success) {
          this.semesterModalError = response.message || 'Failed to save semester dates.';
          return;
        }
        this.notification.success('Program semester dates saved successfully.');
        this.showSemesterModal = false;
        this.loadData();
      },
      error: error => {
        this.isSavingSemesters = false;
        this.semesterModalError = error?.error?.message || 'Failed to save semester dates.';
        this.notification.handleBusinessError(error, 'Failed to save semester dates.');
      }
    });
  }

  closeSemesterModal(): void {
    if (this.isSavingSemesters) return;
    this.showSemesterModal = false;
    this.isSemesterCalendarDropdownOpen = false;
    this.programForSemesterConfirmation = undefined;
    this.programSemesters = [];
    this.academicCalendars = [];
    this.selectedAcademicCalendarId = null;
    this.semesterModalError = '';
  }

  toggleSemesterCalendarDropdown(event: Event): void {
    event.stopPropagation();
    if (this.isSavingSemesters || this.isSemesterCalendarDropdownOpen) {
      this.isSemesterCalendarDropdownOpen = false;
      return;
    }
    this.semesterCalendarDropdownWidth = (event.currentTarget as HTMLElement).getBoundingClientRect().width;
    this.isSemesterCalendarDropdownOpen = true;
  }

  handleSemesterCalendarDropdownKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isSemesterCalendarDropdownOpen = false;
      (event.currentTarget as HTMLElement).focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.semesterCalendarDropdownWidth = (event.currentTarget as HTMLElement).getBoundingClientRect().width;
      this.isSemesterCalendarDropdownOpen = true;
      this.focusSemesterCalendarOption(event.key === 'ArrowUp' ? this.academicCalendars.length : 0);
    }
  }

  handleSemesterCalendarOptionKeydown(event: KeyboardEvent, index: number): void {
    const options = Array.from(document.querySelectorAll<HTMLButtonElement>('#semesterCalendarOptions .semester-calendar-option'));
    let nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex = Math.min(index + 1, options.length - 1);
    else if (event.key === 'ArrowUp') nextIndex = Math.max(index - 1, 0);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      this.isSemesterCalendarDropdownOpen = false;
      document.getElementById('semesterCalendar')?.focus();
      return;
    } else {
      return;
    }
    event.preventDefault();
    options[nextIndex]?.focus();
  }

  private focusSemesterCalendarOption(index: number): void {
    setTimeout(() => {
      const options = document.querySelectorAll<HTMLButtonElement>('#semesterCalendarOptions .semester-calendar-option');
      options[Math.min(index, Math.max(options.length - 1, 0))]?.focus();
    });
  }

  semesterCalendarLabel(): string {
    if (this.selectedAcademicCalendarId == null) return 'Select an academic calendar to generate dates';
    const selected = this.academicCalendars.find(calendar => calendar.academicCalendarId === this.selectedAcademicCalendarId);
    if (!selected) return 'Select an academic calendar to generate dates';
    const formatDate = (value: string): string => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    return `${selected.academicYearName} (${formatDate(selected.periodStartDate)} – ${formatDate(selected.periodEndDate)})`;
  }

  private toDateInput(value?: string | null): string | null {
    if (!value) return null;
    return value.slice(0, 10);
  }

  private validateProgramSemesters(): string {
    for (const semester of this.programSemesters) {
      if (!semester.startDate || !semester.endDate ||
          !semester.registrationStartDate || !semester.registrationEndDate) {
        return `Enter all four dates for ${semester.semesterName}.`;
      }
      if (semester.startDate > semester.endDate) {
        return `${semester.semesterName} start date must be on or before its end date.`;
      }
      if (semester.registrationStartDate > semester.registrationEndDate) {
        return `${semester.semesterName} registration start date must be on or before its end date.`;
      }
    }
    return '';
  }

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
