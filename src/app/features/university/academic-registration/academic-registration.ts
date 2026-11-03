import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HelperMethods } from '../../../core/helpers/helper-methods';

import { AcademicRegistrationFilterModel } from '../../../core/models/university/academic-registration/academic-registration-filter.model';
import { AcademicRegistrationModel } from '../../../core/models/university/academic-registration/academic-registration.model';
import { RegisterStudentRequestModel } from '../../../core/models/university/academic-registration/register-student-request.model';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { AcademicRegistrationService } from '../../../core/services/university/academic-registration.service';
import { UniversityRegistrationWindowService } from '../../../core/services/university/university-registration-window.service';
import {
  AcademicPeriodType,
  OpenUniversityRegistrationWindowRequest,
  UniversityOption,
  UniversityRegistrationWindow
} from '../../../core/models/university/academic-registration/university-registration-window.model';
import { NotificationService } from '../../../core/services/common/notification.service';
import { AcademicResultsImportPreviewModel } from '../../../core/models/university/academic-registration/academic-results.model';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramSemester } from '../../../core/models/university/programs/program-semester.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-academic-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './academic-registration.html',
  styleUrl: './academic-registration.scss',
})
export class AcademicRegistration implements OnInit, OnDestroy {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isPeriodDropdownOpen = false;
    this.isAcademicYearDropdownOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showCentralWindowDialog) this.closeCentralWindowDialog();
    if (this.showUploadResultsDialog) this.closeUploadResultsDialog();
  }

  private router = inject(Router);
  private registrationService = inject(AcademicRegistrationService);
  private centralWindowService = inject(UniversityRegistrationWindowService);
  private notification = inject(NotificationService);
  private studentStatusService = inject(StudentStatusService);
  private programService = inject(ProgramService);
  private confirmDialog = inject(ConfirmDialogService);

  // Table Data
  students: AcademicRegistrationModel[] = [];
  totalRecords = 0;
  readonly selectedStudentIds = new Set<number>();

  // Results import state. The server parses and validates the workbook before submission.
  showUploadResultsDialog = false;
  selectedResultsFile: File | null = null;
  resultsImportPreview: AcademicResultsImportPreviewModel | null = null;
  isPreviewingResultsImport = false;
  isSubmittingResultsImport = false;
  resultsImportError = '';
  readonly maxResultsImportBytes = 5 * 1024 * 1024;

  // Filter
  filter: AcademicRegistrationFilterModel = new AcademicRegistrationFilterModel();

  // Search
  searchText = '';

  // Pagination Dropdown
  isPageSizeDropdownOpen = false;
  isPeriodDropdownOpen = false;
  isAcademicYearDropdownOpen = false;
  activePeriodOption = 0;
  activeAcademicYearOption = 0;

  showBulkRegistrationDialog = false;
  isPreparingBulkRegistration = false;
  isConfirmingBulkRegistration = false;
  isBulkRegistering = false;
  bulkCompletedCount = 0;
  bulkSemesterNo: number | null = null;
  bulkSemesterChoices: Array<{ semesterNo: number; label: string }> = [];
  bulkStudents: AcademicRegistrationModel[] = [];
  bulkPeriodSummary = '';
  bulkRegistrationResults: {
    successes: AcademicRegistrationModel[];
    failures: Array<{ student: AcademicRegistrationModel; message: string }>;
  } | null = null;

  // Central university-wide registration window state
  universities: UniversityOption[] = [];
  centralWindows: UniversityRegistrationWindow[] = [];
  showCentralWindowHistory = false;
  showCentralWindowDialog = false;
  centralWindowFormMode: 'new' | 'existing' = 'new';
  isLoadingCentralWindows = false;
  isSavingCentralWindow = false;
  isClosingCentralWindow = false;
  selectedUniversityId: number | null = null;
  selectedPeriodType = AcademicPeriodType.Fall;
  selectedAcademicYearStart = new Date().getFullYear();
  centralRegistrationFrom = '';
  centralRegistrationTo = '';
  centralWindowNotes = '';
  readonly todayDate = this.formatDateInput(new Date());
  readonly academicPeriods = [
    { value: AcademicPeriodType.Fall, label: 'Fall' },
    { value: AcademicPeriodType.Spring, label: 'Spring' },
    { value: AcademicPeriodType.Summer, label: 'Summer' },
    { value: AcademicPeriodType.Winter, label: 'Winter' },
    { value: AcademicPeriodType.SpringSummer, label: 'Spring–Summer' },
    { value: AcademicPeriodType.FallWinter, label: 'Fall–Winter' }
  ];
  readonly academicYearStarts = this.createAcademicYearStarts();
  private currentTime = Date.now();
  private registrationStatusTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
    this.loadCentralWindows();
    this.registrationStatusTimer = setInterval(() => {
      this.currentTime = Date.now();
      this.reconcileSelectedStudents();
    }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.registrationStatusTimer) clearInterval(this.registrationStatusTimer);
  }

  private createAcademicYearStarts(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - 1 + index);
  }

  loadCentralWindows(): void {
    this.isLoadingCentralWindows = true;
    this.centralWindowService.getForUser().subscribe({
      next: (response) => {
        this.isLoadingCentralWindows = false;
        if (!response.success || !response.result) return;
        this.universities = response.result.universities || [];
        this.centralWindows = response.result.windows || [];
        if (this.selectedUniversityId == null && this.universities.length > 0) {
          this.selectedUniversityId = this.universities[0].universityId;
        }
        this.reconcileSelectedStudents();
      },
      error: (error) => {
        this.isLoadingCentralWindows = false;
        this.notification.handleBusinessError(error, 'Failed to load university registration windows.');
      }
    });
  }

  openCentralWindowDialog(loadActiveWindow = false): void {
    if (!this.universities.length) {
      this.notification.warning('No university is assigned to your account.');
      return;
    }
    const activeWindow = this.activeCentralWindow;
    this.selectedPeriodType = activeWindow?.periodType ?? AcademicPeriodType.Fall;
    this.selectedAcademicYearStart = activeWindow?.academicYearStart ?? new Date().getFullYear();
    this.isPeriodDropdownOpen = false;
    this.isAcademicYearDropdownOpen = false;
    this.resetCentralWindowForm();
    if (loadActiveWindow && activeWindow) this.syncSelectedCentralWindow();
    this.showCentralWindowDialog = true;
  }

  closeCentralWindowDialog(): void {
    if (!this.isSavingCentralWindow && !this.isClosingCentralWindow) {
      this.showCentralWindowDialog = false;
      this.isPeriodDropdownOpen = false;
      this.isAcademicYearDropdownOpen = false;
      this.resetCentralWindowForm();
    }
  }

  syncSelectedCentralWindow(): void {
    const existing = this.selectedCentralWindow;
    this.centralWindowFormMode = existing ? 'existing' : 'new';
    this.centralRegistrationFrom = existing?.registrationFrom ? this.toDateInput(existing.registrationFrom) : '';
    this.centralRegistrationTo = existing ? this.toDateInput(existing.registrationTo) : '';
    this.centralWindowNotes = existing?.notes || '';
  }

  private resetCentralWindowForm(): void {
    this.centralWindowFormMode = 'new';
    this.centralRegistrationFrom = '';
    this.centralRegistrationTo = '';
    this.centralWindowNotes = '';
  }

  get selectedCentralWindow(): UniversityRegistrationWindow | undefined {
    return this.centralWindows.find(window =>
      window.universityId === this.selectedUniversityId &&
      window.periodType === this.selectedPeriodType &&
      window.academicYearStart === this.selectedAcademicYearStart
    );
  }

  get selectedCentralPeriodLabel(): string {
    return this.academicPeriods.find(item => item.value === this.selectedPeriodType)?.label || '';
  }

  get visibleCentralWindows(): UniversityRegistrationWindow[] {
    if (this.selectedUniversityId == null) return this.centralWindows;
    return this.centralWindows.filter(window => window.universityId === this.selectedUniversityId);
  }

  get currentlyOpenWindows(): UniversityRegistrationWindow[] {
    return this.visibleCentralWindows.filter(item => this.isCentralWindowCurrentlyOpen(item));
  }

  get activeCentralWindow(): UniversityRegistrationWindow | undefined {
    return this.currentlyOpenWindows[0];
  }

  isCentralWindowCurrentlyOpen(window: UniversityRegistrationWindow): boolean {
    if (!window.isOpen || !window.registrationFrom) return false;
    const from = Date.parse(window.registrationFrom);
    const to = Date.parse(window.registrationTo);
    return Number.isFinite(from) && Number.isFinite(to) && from <= this.currentTime && to >= this.currentTime;
  }

  centralWindowStatus(window: UniversityRegistrationWindow): 'Open' | 'Scheduled' | 'Expired' | 'Closed' {
    if (this.isCentralWindowCurrentlyOpen(window)) return 'Open';
    if (!window.isOpen) return 'Closed';
    return Date.parse(window.registrationFrom || '') > this.currentTime ? 'Scheduled' : 'Expired';
  }

  isStudentRegistrationOpen(universityId: number): boolean {
    return this.centralWindows.some(window =>
      window.universityId === universityId && this.isCentralWindowCurrentlyOpen(window));
  }

  canRegisterStudent(student: AcademicRegistrationModel): boolean {
    return student.applicationStatusId === StudentStatusEnum.Sponsored &&
      this.isStudentRegistrationOpen(student.universityId);
  }

  get eligibleVisibleStudents(): AcademicRegistrationModel[] {
    return this.students.filter(student => this.canRegisterStudent(student));
  }

  get hasVisibleRegisterableStudents(): boolean {
    return this.eligibleVisibleStudents.length > 0;
  }

  get selectedEligibleVisibleStudents(): AcademicRegistrationModel[] {
    return this.eligibleVisibleStudents.filter(student => this.selectedStudentIds.has(student.studentId));
  }

  get allVisibleEligibleStudentsSelected(): boolean {
    const eligible = this.eligibleVisibleStudents;
    return eligible.length > 0 && eligible.every(student => this.selectedStudentIds.has(student.studentId));
  }

  get someVisibleEligibleStudentsSelected(): boolean {
    const eligible = this.eligibleVisibleStudents;
    const selectedCount = eligible.filter(student => this.selectedStudentIds.has(student.studentId)).length;
    return selectedCount > 0 && selectedCount < eligible.length;
  }

  isStudentSelected(student: AcademicRegistrationModel): boolean {
    return this.selectedStudentIds.has(student.studentId);
  }

  toggleStudentSelection(student: AcademicRegistrationModel, selected: boolean): void {
    if (!this.canRegisterStudent(student)) {
      this.selectedStudentIds.delete(student.studentId);
      return;
    }
    if (selected) this.selectedStudentIds.add(student.studentId);
    else this.selectedStudentIds.delete(student.studentId);
  }

  toggleVisibleStudentSelection(selected: boolean): void {
    for (const student of this.eligibleVisibleStudents) {
      if (selected) this.selectedStudentIds.add(student.studentId);
      else this.selectedStudentIds.delete(student.studentId);
    }
  }

  private reconcileSelectedStudents(): void {
    const eligibleIds = new Set(this.eligibleVisibleStudents.map(student => student.studentId));
    for (const studentId of this.selectedStudentIds) {
      if (!eligibleIds.has(studentId)) this.selectedStudentIds.delete(studentId);
    }
  }

  openUploadResultsDialog(): void {
    this.resetResultsImport();
    this.showUploadResultsDialog = true;
  }

  closeUploadResultsDialog(): void {
    if (this.isPreviewingResultsImport || this.isSubmittingResultsImport) return;
    this.showUploadResultsDialog = false;
    this.resetResultsImport();
  }

  onResultsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    const extension = file?.name.split('.').pop()?.toLowerCase();
    this.resultsImportPreview = null;
    this.resultsImportError = '';
    this.selectedResultsFile = file && extension === 'xlsx' && file.size <= this.maxResultsImportBytes ? file : null;
    if (file && !this.selectedResultsFile) {
      input.value = '';
      this.resultsImportError = extension !== 'xlsx'
        ? 'Only .xlsx workbooks are supported.'
        : 'The workbook must be no larger than 5 MB.';
      this.notification.warning(this.resultsImportError);
    }
  }

  removeResultsFile(input: HTMLInputElement): void {
    if (this.isPreviewingResultsImport || this.isSubmittingResultsImport) return;
    this.selectedResultsFile = null;
    this.resultsImportPreview = null;
    this.resultsImportError = '';
    input.value = '';
  }

  private resetResultsImport(): void {
    this.selectedResultsFile = null;
    this.resultsImportPreview = null;
    this.resultsImportError = '';
    this.isPreviewingResultsImport = false;
    this.isSubmittingResultsImport = false;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  downloadResultsTemplate(): void {
    this.registrationService.downloadResultsImportTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'sms-academic-results-template.xlsx';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => this.notification.handleBusinessError(error, 'Failed to download the results template.')
    });
  }

  processResultsUpload(): void {
    if (!this.selectedResultsFile || this.isPreviewingResultsImport || this.isSubmittingResultsImport) return;
    this.resultsImportPreview = null;
    this.resultsImportError = '';
    this.isPreviewingResultsImport = true;
    this.registrationService.previewResultsImport(this.selectedResultsFile).subscribe({
      next: (response) => {
        this.isPreviewingResultsImport = false;
        if (response.success && response.result) {
          this.resultsImportPreview = response.result;
          if (!response.result.canSubmit) this.resultsImportError = response.result.message || 'Correct workbook errors before submitting.';
          return;
        }
        this.resultsImportError = response.message || 'The workbook could not be validated.';
        this.notification.warning(this.resultsImportError);
      },
      error: (error) => {
        this.isPreviewingResultsImport = false;
        this.resultsImportError = this.apiErrorMessage(error, 'The workbook could not be validated.');
        if (!this.notification.handleBusinessError(error, this.resultsImportError)) this.notification.error(this.resultsImportError);
      }
    });
  }

  submitResultsImport(): void {
    if (!this.selectedResultsFile || !this.resultsImportPreview?.canSubmit || this.isSubmittingResultsImport) return;
    this.isSubmittingResultsImport = true;
    this.registrationService.importResults(
      this.selectedResultsFile,
      this.resultsImportPreview.previewToken,
      this.resultsImportPreview.expectedUpdatedOn
    ).subscribe({
      next: (response) => {
        this.isSubmittingResultsImport = false;
        if (!response.success || !response.result) {
          this.resultsImportError = response.message || 'The results import was not saved.';
          this.notification.error(this.resultsImportError);
          return;
        }
        this.notification.success(response.message || 'Results saved as a Draft. Review them in Academic Record before finalizing.');
        this.showUploadResultsDialog = false;
        this.resetResultsImport();
      },
      error: (error) => {
        this.isSubmittingResultsImport = false;
        this.resultsImportError = this.apiErrorMessage(error, 'The results import was not saved.');
        if (error?.status === 409) this.notification.warning(`${this.resultsImportError} Reload the latest Academic Record before retrying.`);
        else if (!this.notification.handleBusinessError(error, this.resultsImportError)) this.notification.error(this.resultsImportError);
      }
    });
  }

  async registerSelectedStudents(): Promise<void> {
    // temporaraily commnted    
  }

  async registerSelectedStudent(): Promise<void> {
    if (this.isPreparingBulkRegistration || this.isConfirmingBulkRegistration || this.isBulkRegistering) return;

    this.currentTime = Date.now();
    this.reconcileSelectedStudents();
    const selectedByApplication = new Map<number, AcademicRegistrationModel>();
    for (const student of this.selectedEligibleVisibleStudents) {
      if (!selectedByApplication.has(student.applicationId)) selectedByApplication.set(student.applicationId, student);
    }
    const selectedStudents = [...selectedByApplication.values()];
    if (!selectedStudents.length) {
      this.notification.warning('Select at least one eligible sponsored student.');
      return;
    }

    this.bulkStudents = selectedStudents;
    this.bulkSemesterNo = null;
    this.bulkSemesterChoices = [];
    this.bulkRegistrationResults = null;
    this.bulkPeriodSummary = this.getBulkPeriodSummary(selectedStudents);
    this.isPreparingBulkRegistration = true;

    try {
      const programIds = [...new Set(selectedStudents.map(student => student.programId))];
      const programConfigurations = await firstValueFrom(forkJoin(
        programIds.map(programId => forkJoin({
          program: this.programService.getProgramById(programId),
          semesters: this.programService.getSemesterByProgramId(programId)
        }))
      ));

      const semestersByProgram = new Map<number, ProgramSemester[]>();
      const semesterCountByProgram = new Map<number, number>();
      programConfigurations.forEach((configuration, index) => {
        const programId = programIds[index];
        if (!configuration.program.success || !configuration.program.result) {
          const apiMessage = configuration.program.message?.trim();
          throw new Error(
            `Program configuration could not be loaded for program ${programId}.${apiMessage ? ` ${apiMessage}` : ''}`
          );
        }
        const configuredCount = configuration.program.result.numberOfSemesters;
        if (!Number.isInteger(configuredCount) || configuredCount < 1) {
          throw new Error(`Program ${programId} has an invalid configured semester count.`);
        }
        if (!Array.isArray(configuration.semesters.result)) {
          const apiMessage = configuration.semesters.message?.trim();
          throw new Error(
            `Configured semesters could not be loaded for program ${programId}.${apiMessage ? ` ${apiMessage}` : ''}`
          );
        }
        if (configuration.semesters.result.length === 0) {
          throw new Error(`No configured semesters are available for program ${programId}. Configure persisted program semesters before registering students.`);
        }
        if (!configuration.semesters.success) {
          const apiMessage = configuration.semesters.message?.trim();
          throw new Error(
            `Configured semesters could not be loaded for program ${programId}.${apiMessage ? ` ${apiMessage}` : ''}`
          );
        }
        semesterCountByProgram.set(programId, configuredCount);
        semestersByProgram.set(programId, configuration.semesters.result);
      });

      const commonSemesterNumbers = (semestersByProgram.get(programIds[0]) || [])
        .map(semester => semester.semesterNo)
        .filter((semesterNo, index, values) => values.indexOf(semesterNo) === index)
        .filter(semesterNo => Number.isInteger(semesterNo) && semesterNo >= 1)
        .filter(semesterNo => programIds.every(programId => {
          const configuredCount = semesterCountByProgram.get(programId) || 0;
          return semesterNo <= configuredCount &&
            (semestersByProgram.get(programId) || []).filter(item => item.semesterNo === semesterNo).length === 1;
        }))
        .sort((a, b) => a - b);

      this.bulkSemesterChoices = commonSemesterNumbers.map(semesterNo => {
        const scheduleLabels = programIds.map(programId => {
          const semester = (semestersByProgram.get(programId) || []).find(item => item.semesterNo === semesterNo)!;
          const term = [semester.termName, semester.academicYearName].filter(Boolean).join(' ');
          const label = term || semester.semesterName || `Semester ${semesterNo}`;
          const programName = selectedStudents.find(student => student.programId === programId)?.programName || `Program ${programId}`;
          return `${programName}: ${label}`;
        });
        return {
          semesterNo,
          label: `Semester ${semesterNo} — ${[...new Set(scheduleLabels)].join('; ')}`
        };
      });

      if (!this.bulkSemesterChoices.length) {
        throw new Error('The selected students’ programs do not share an unambiguous configured semester number. Select students from compatible programs and try again.');
      }

      this.showBulkRegistrationDialog = true;
    } catch (error: any) {
      this.notification.error(this.bulkRegistrationErrorMessage(error) || 'Could not prepare bulk registration.');
    } finally {
      this.isPreparingBulkRegistration = false;
    }
  }

  closeBulkRegistrationDialog(): void {
    if (this.isConfirmingBulkRegistration || this.isBulkRegistering) return;
    this.showBulkRegistrationDialog = false;
    this.bulkSemesterNo = null;
    this.bulkSemesterChoices = [];
    this.bulkStudents = [];
    this.bulkRegistrationResults = null;
  }

  async confirmBulkRegistration(): Promise<void> {
    if (this.isConfirmingBulkRegistration || this.isBulkRegistering || this.bulkSemesterNo == null) return;
    const semesterNo = this.bulkSemesterNo;
    const selectedChoice = this.bulkSemesterChoices.find(choice => choice.semesterNo === semesterNo);
    if (!selectedChoice || !this.bulkStudents.length) return;

    this.currentTime = Date.now();
    const noLongerEligible = this.bulkStudents.filter(student => !this.canRegisterStudent(student));
    if (noLongerEligible.length) {
      this.reconcileSelectedStudents();
      this.notification.warning('One or more students are no longer eligible under the current registration window. Review the list and prepare the selection again.');
      this.closeBulkRegistrationDialog();
      return;
    }

    this.isConfirmingBulkRegistration = true;
    let confirmed = false;
    try {
      confirmed = await this.confirmDialog.confirm({
        title: 'Confirm Bulk Registration',
        message: `You are about to register ${this.bulkStudents.length} student${this.bulkStudents.length === 1 ? '' : 's'} for ${selectedChoice.label}. Current central registration period(s): ${this.bulkPeriodSummary}. Continue? The API will validate each application and automatically enroll all active courses configured for the selected semester.`,
        confirmText: 'Confirm Registration',
        cancelText: 'Cancel',
        variant: 'info'
      });
    } catch {
      this.notification.error('Could not open the registration confirmation.');
      this.isConfirmingBulkRegistration = false;
      return;
    }
    this.isConfirmingBulkRegistration = false;
    if (!confirmed) return;

    this.isBulkRegistering = true;
    this.bulkCompletedCount = 0;
    const successes: AcademicRegistrationModel[] = [];
    const failures: Array<{ student: AcademicRegistrationModel; message: string }> = [];
    try {
      for (const student of this.bulkStudents) {
        const request = new RegisterStudentRequestModel();
        request.applicationId = student.applicationId;
        request.semesterNo = semesterNo;
        request.registrationDate = student.registrationDate ? new Date(student.registrationDate) : new Date();

        try {
          const response = await firstValueFrom(this.registrationService.registerStudent(request));
          if (response.success) successes.push(student);
          else failures.push({ student, message: response.message || 'The registration request was not accepted.' });
        } catch (error: any) {
          failures.push({
            student,
            message: this.bulkRegistrationErrorMessage(error)
          });
        } finally {
          this.bulkCompletedCount++;
        }
      }

      successes.forEach(student => this.selectedStudentIds.delete(student.studentId));
      this.bulkRegistrationResults = { successes, failures };
      this.loadData();

      if (failures.length === 0) {
        this.notification.success(`Successfully registered ${successes.length} student${successes.length === 1 ? '' : 's'}.`);
      } else if (successes.length > 0) {
        this.notification.warning(`Successfully registered ${successes.length}; ${failures.length} failed. Review the details in this dialog.`);
      } else {
        this.notification.error(`All ${failures.length} registration requests failed. Review the details in this dialog.`);
      }
    } finally {
      this.isBulkRegistering = false;
    }
  }

  private getBulkPeriodSummary(students: AcademicRegistrationModel[]): string {
    const universityIds = new Set(students.map(student => student.universityId));
    const labels: string[] = [];
    for (const universityId of universityIds) {
      const windows = this.centralWindows.filter(window =>
        window.universityId === universityId && this.isCentralWindowCurrentlyOpen(window)
      );
      const universityName = windows[0]?.universityName ||
        students.find(student => student.universityId === universityId)?.universityName || `University ${universityId}`;
      const periods = [...new Set(windows.map(window => window.periodLabel))];
      labels.push(`${universityName}: ${periods.length ? periods.join(', ') : 'no open period'}`);
    }
    return labels.join('; ');
  }

  bulkRegistrationErrorMessage(error: any): string {
    const message = HelperMethods.getApiErrorMessage(error);
    return message === 'Something went wrong.' ? 'Registration failed.' : message;
  }

  periodLabel(periodType: number, yearStart: number): string {
    const period = this.academicPeriods.find(item => item.value === periodType)?.label || 'Period';
    return periodType === AcademicPeriodType.Summer ? `${period} ${yearStart}` : `${period} ${yearStart}/${yearStart + 1}`;
  }

  private toDateInput(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private formatDateInput(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  private apiErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }

  toggleCentralDropdown(kind: 'period' | 'year', event: Event): void {
    event.stopPropagation();
    const wasOpen = kind === 'period' ? this.isPeriodDropdownOpen : this.isAcademicYearDropdownOpen;
    this.isPeriodDropdownOpen = kind === 'period' && !wasOpen;
    this.isAcademicYearDropdownOpen = kind === 'year' && !wasOpen;
    if (!wasOpen) {
      if (kind === 'period') this.activePeriodOption = Math.max(0, this.academicPeriods.findIndex(item => item.value === this.selectedPeriodType));
      else this.activeAcademicYearOption = Math.max(0, this.academicYearStarts.indexOf(this.selectedAcademicYearStart));
    }
  }

  handleCentralDropdownKeydown(kind: 'period' | 'year', event: KeyboardEvent): void {
    const itemsLength = kind === 'period' ? this.academicPeriods.length : this.academicYearStarts.length;
    const isOpen = kind === 'period' ? this.isPeriodDropdownOpen : this.isAcademicYearDropdownOpen;
    let activeIndex = kind === 'period' ? this.activePeriodOption : this.activeAcademicYearOption;

    if (event.key === 'Escape') {
      this.isPeriodDropdownOpen = false;
      this.isAcademicYearDropdownOpen = false;
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      this.toggleCentralDropdown(kind, event);
      event.preventDefault();
      return;
    }
    if (!isOpen) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + itemsLength) % itemsLength;
      if (kind === 'period') this.activePeriodOption = activeIndex;
      else this.activeAcademicYearOption = activeIndex;
      event.preventDefault();
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (kind === 'period') this.selectCentralPeriod(this.academicPeriods[activeIndex].value);
      else this.selectCentralAcademicYear(this.academicYearStarts[activeIndex]);
      event.preventDefault();
    }
  }

  selectCentralPeriod(value: AcademicPeriodType): void {
    this.selectedPeriodType = value;
    this.isPeriodDropdownOpen = false;
    this.syncSelectedCentralWindow();
  }

  selectCentralAcademicYear(value: number): void {
    this.selectedAcademicYearStart = value;
    this.isAcademicYearDropdownOpen = false;
    this.syncSelectedCentralWindow();
  }

  saveCentralWindow(): void {
    if (!this.selectedUniversityId || !this.centralRegistrationFrom || !this.centralRegistrationTo) {
      this.notification.warning('University, academic period, academic year, registration opening date, and registration closing date are required.');
      return;
    }
    if (this.centralRegistrationFrom >= this.centralRegistrationTo) {
      this.notification.warning('Registration From must be earlier than Registration To.');
      return;
    }
    const registrationFrom = new Date(`${this.centralRegistrationFrom}T00:00:00`).toISOString();
    const registrationTo = new Date(`${this.centralRegistrationTo}T23:59:59`).toISOString();
    const request: OpenUniversityRegistrationWindowRequest = {
      universityId: this.selectedUniversityId,
      periodType: this.selectedPeriodType,
      academicYearStart: this.selectedAcademicYearStart,
      registrationFrom,
      registrationTo,
      notes: this.centralWindowNotes.trim() || undefined,
      rowVersion: this.selectedCentralWindow?.rowVersion
    };
    this.isSavingCentralWindow = true;
    this.centralWindowService.openOrUpdate(request).subscribe({
      next: (response) => {
        this.isSavingCentralWindow = false;
        if (!response.success) return;
        this.notification.success('Registration window opened successfully.');
        this.closeCentralWindowDialog();
        this.loadCentralWindows();
      },
      error: (error) => {
        this.isSavingCentralWindow = false;
        this.notification.handleBusinessError(error, 'Failed to open registration.');
      }
    });
  }

  closeSelectedCentralWindow(): void {
    if (this.isClosingCentralWindow || this.isSavingCentralWindow) return;
    const window = this.selectedCentralWindow;
    if (!window?.isOpen) return;
    if (!window.universityRegistrationWindowId || !window.rowVersion) {
      this.notification.error('Reload the registration window before closing it.');
      return;
    }
    const anotherWindowOpen = this.visibleCentralWindows.some(openWindow =>
      openWindow.isOpen && openWindow.universityRegistrationWindowId !== window.universityRegistrationWindowId);
    const confirmation = anotherWindowOpen
      ? `Close registration for ${window.periodLabel}? Other registration periods will remain open.`
      : 'Close the current registration window? Students cannot be enrolled until you open a new one.';
    if (!globalThis.confirm(confirmation)) return;
    this.isClosingCentralWindow = true;
    this.centralWindowService.close(window.universityRegistrationWindowId, { rowVersion: window.rowVersion }).subscribe({
      next: (response) => {
        this.isClosingCentralWindow = false;
        if (!response.success) {
          this.notification.warning(response.message || 'Failed to close registration.');
          return;
        }
        window.isOpen = false;
        window.isCurrentlyOpen = false;
        this.reconcileSelectedStudents();
        this.closeCentralWindowDialog();
        this.notification.success('Registration window closed successfully.');
        this.loadCentralWindows();
      },
      error: (error) => {
        this.isClosingCentralWindow = false;
        if (!this.notification.handleBusinessError(error, 'Failed to close registration.')) {
          this.notification.error('Failed to close registration.');
        }
      }
    });
  }

  loadData(): void {
    this.registrationService.searchAcademicRegistrations(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.students = response.result.items;
          this.totalRecords = response.result.totalCount;
          this.reconcileSelectedStudents();

          return;
        }
        this.students = [];
        this.reconcileSelectedStudents();
      },
      error: (error) => {
        this.students = [];
        this.reconcileSelectedStudents();
        this.notification.handleBusinessError(
          error,
          'Failed to load academic registrations.'
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

  // --- Navigation to Dedicated Register Page ---
  navigateToRegister(student: AcademicRegistrationModel): void {
    const semesterNo = student.semesterNo || (this.filter.semesterNo > 0 ? this.filter.semesterNo : 1);
    this.router.navigate(['/academic-registration/register', student.applicationId], {
      queryParams: { semester: semesterNo }
    });
  }

  // --- Status Badge Helper ---
  getStatusBadgeClass(statusId: number): string {
    return this.studentStatusService.getBadgeClass(statusId || StudentStatusEnum.Sponsored);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  // --- Photo Handling ---
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
