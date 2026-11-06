import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';

import { NotificationService } from '../../../core/services/common/notification.service';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { AcademicRegistrationService } from '../../../core/services/university/academic-registration.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramSemester } from '../../../core/models/university/programs/program-semester.model';
import { AcademicHistoryModel, AcademicHistoryRegistrationModel } from '../../../core/models/university/academic-registration/academic-history.model';
import { AcademicProgressionResponseModel, AcademicRegistrationResultsModel, FinalizeAcademicResultsRequestModel, ProgressAcademicRegistrationRequestModel, SaveAcademicResultsRequestModel } from '../../../core/models/university/academic-registration/academic-results.model';
import { ProgramCourseType } from '../../../core/enums/program-course-type.enum';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { SemesterResultsDialog, SemesterResultsSaveEvent } from '../semester-results-dialog/semester-results-dialog';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { StaffType } from '../../../core/enums/staff-type.enum';

@Component({
  selector: 'app-academic-record',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SemesterResultsDialog],
  templateUrl: './academic-record.html',
  styleUrls: ['./academic-record.scss', '../university-students/university-students.scss']
})
export class AcademicRecord implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private studentProgramService = inject(StudentProgramService);
  private studentStatusService = inject(StudentStatusService);
  private academicRegistrationService = inject(AcademicRegistrationService);
  private confirmDialog = inject(ConfirmDialogService);
  private programService = inject(ProgramService);
  private userProfileService = inject(CurrentUserProfileService);

  isNgoUser: boolean = false;
  applicationId: number = 0;
  student: StudentProgramApplication | null = null;
  program: ProgramRequest | null = null;
  isLoading: boolean = true;
  studentLoadMessage = '';
  photoError: boolean = false;
  historyLoading = false;
  history: AcademicHistoryModel | null = null;
  historyState: 'idle' | 'loading' | 'loaded' | 'not-found' | 'unauthorized' | 'conflict' | 'error' = 'idle';
  historyMessage = '';
  selectedAcademicRegistrationId: number | null = null;
  resultsLoading = false;
  isSavingResults = false;
  isFinalizingResults = false;
  isProgressingRegistration = false;
  resultsRequiresRefresh = false;
  resultsRefreshMessage = '';
  results: AcademicRegistrationResultsModel | null = null;
  semesterSchedule: ProgramSemester | null = null;
  nextSemesterSchedule: ProgramSemester | null = null;
  scheduleLoading = false;
  scheduleUnavailable = false;
  resultsState: 'idle' | 'loading' | 'loaded' | 'not-found' | 'unauthorized' | 'conflict' | 'error' = 'idle';
  resultsMessage = '';
  validationMessage = '';
  private resultsRequestVersion = 0;
  private historyRequestVersion = 0;
  private savedDraftSnapshot: {
    semesterGpa: number | null;
    internalNote: string;
    courseOutcomes: Map<number, boolean | null>;
  } | null = null;

  ngOnInit(): void {
    const profile = this.userProfileService.getCurrentUserProfile();
    if (profile && profile.staffType === StaffType.Ngo) {
      this.isNgoUser = true;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    const applicationId = Number(idParam);
    if (Number.isSafeInteger(applicationId) && applicationId > 0) {
      this.applicationId = applicationId;
      this.loadStudentDetails();
    } else {
      this.isLoading = false;
      this.studentLoadMessage = 'A valid student application was not specified.';
    }
  }

  loadStudentDetails(): void {
    this.isLoading = true;
    this.studentLoadMessage = '';
    this.studentProgramService.getById(this.applicationId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.result) {
          this.student = res.result;
          if (this.student.applicationId && this.student.applicationId > 0) {
            this.applicationId = this.student.applicationId;
          }
          this.photoError = false;
          if (this.student.programId) {
            this.programService.getProgramById(this.student.programId).subscribe({
              next: (pRes) => {
                if (pRes?.success && pRes.result) {
                  this.program = pRes.result;
                }
              }
            });
          }
          this.loadAcademicHistory();
        } else {
          this.studentLoadMessage = res.message || 'Failed to load student details.';
          this.notification.error(this.studentLoadMessage);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.studentLoadMessage = this.apiErrorMessage(error, 'Failed to load student details.');
        if (!this.notification.handleBusinessError(error, this.studentLoadMessage))
          this.notification.error(this.studentLoadMessage);
      }
    });
  }

  get reversedRegistrations(): AcademicHistoryRegistrationModel[] {
    if (!this.history?.registrations) return [];
    return [...this.history.registrations].reverse();
  }

  get currentSemesterNo(): number {
    if (this.results?.semesterNo) return this.results.semesterNo;
    if (this.history?.registrations?.length) {
      return Math.max(...this.history.registrations.map(r => r.semesterNo));
    }
    return 1;
  }

  get currentYear(): number {
    return Math.max(1, Math.ceil(this.currentSemesterNo / 2));
  }

  get totalYears(): number | null {
    if (this.program?.numberOfSemesters && this.program.numberOfSemesters > 0) {
      return Math.max(1, Math.ceil(this.program.numberOfSemesters / 2));
    }
    return null;
  }

  get totalProgramSemesters(): number | null {
    return (this.program?.numberOfSemesters && this.program.numberOfSemesters > 0)
      ? this.program.numberOfSemesters
      : null;
  }

  get creditsRequired(): number | null {
    return (this.program?.creditsRequired && this.program.creditsRequired > 0)
      ? this.program.creditsRequired
      : null;
  }

  isRegistrationCompleted(reg: AcademicHistoryRegistrationModel | null | undefined): boolean {
    if (!reg) return false;
    const st = (reg.semesterResult?.submissionStatus || '').toLowerCase();
    return st === 'finalized' || st === 'submitted';
  }

  get creditsEarned(): number {
    const regs = this.history?.registrations || [];
    let earned = 0;
    for (const reg of regs) {
      if (this.isRegistrationCompleted(reg)) {
        const passedCourses = (reg.courses || []).filter(c => c.isPassed === true);
        earned += passedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
      }
    }
    return earned;
  }

  get cumulativeGpa(): number | null {
    const regs = this.history?.registrations || [];
    const gradedRegistrations = regs.filter(r =>
      this.isRegistrationCompleted(r) &&
      typeof r.semesterResult?.semesterGpa === 'number' &&
      !isNaN(r.semesterResult.semesterGpa)
    );
    if (gradedRegistrations.length === 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;
    for (const reg of gradedRegistrations) {
      const gpa = reg.semesterResult!.semesterGpa!;
      const semCredits = (reg.courses || []).reduce((sum, c) => sum + (c.credits || 0), 0) || 1;
      totalPoints += (gpa * semCredits);
      totalCredits += semCredits;
    }
    if (totalCredits <= 0) return null;
    const result = totalPoints / totalCredits;
    return isNaN(result) ? null : result;
  }

  get creditsSubText(): string {
    const required = this.creditsRequired;
    const yTotal = this.totalYears ? ` of ${this.totalYears}` : '';
    if (required !== null && required !== undefined && required > 0) {
      return `${this.creditsEarned} of ${required} credit hours · Year ${this.currentYear}${yTotal}`;
    }
    if (this.creditsEarned > 0) {
      return `${this.creditsEarned} credit hours earned · Year ${this.currentYear}`;
    }
    return this.totalYears ? `Year ${this.currentYear} of ${this.totalYears}` : `Year ${this.currentYear}`;
  }

  // ==================== Update Status Modal (UI Only) ====================
  isUpdateStatusModalOpen = false;
  isSavingModalResults = false;
  modalExpectedUpdatedOn: string | null = null;
  modalCourses: any[] = [];
  modalGpa: number | null = null;
  modalNote: string = '';
  modalCourseOutcomes = new Map<string, 'pass' | 'fail'>();

  get activeRegistration(): AcademicHistoryRegistrationModel | null {
    if (this.selectedAcademicRegistrationId && this.history?.registrations) {
      const match = this.history.registrations.find(r => r.academicRegistrationId === this.selectedAcademicRegistrationId);
      if (match) return match;
    }
    if (this.history?.registrations?.length) {
      return this.history.registrations[this.history.registrations.length - 1];
    }
    return null;
  }

  get activeCourses(): any[] {
    const activeReg = this.activeRegistration;
    if (activeReg?.courses && activeReg.courses.length > 0) {
      return activeReg.courses;
    }
    if (this.results?.courses && this.results.courses.length > 0) {
      return this.results.courses;
    }
    return [];
  }

  get activeSemesterNo(): number {
    return this.activeRegistration?.semesterNo || this.currentSemesterNo;
  }

  get activeSemesterName(): string {
    return this.activeRegistration?.semesterName || `Semester ${this.activeSemesterNo}`;
  }

  get activeDatesRange(): string {
    const reg = this.activeRegistration;
    if (reg?.startDate && reg?.endDate) {
      const d1 = new Date(reg.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const d2 = new Date(reg.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${d1} -> ${d2}`;
    }
    return '';
  }

  get activeTermName(): string {
    const reg = this.activeRegistration;
    return `${reg?.termName || 'Term'}${reg?.academicYearName ? ' ' + reg.academicYearName : ''}`;
  }

  get nextSemesterNo(): number {
    return this.activeSemesterNo + 1;
  }

  get nextSemesterName(): string {
    return this.nextSemesterSchedule?.semesterName || `Semester ${this.nextSemesterNo}`;
  }

  get nextSemesterTermLabel(): string {
    if (this.nextSemesterSchedule?.termName) {
      return `${this.nextSemesterSchedule.termName}${this.nextSemesterSchedule.academicYearName ? ' ' + this.nextSemesterSchedule.academicYearName : ''}`;
    }
    return `Term ${this.nextSemesterNo}`;
  }

  get failedCoreCoursesList(): string {
    const failedCore = this.activeCourses.filter(c => c.courseType === 1 && this.modalCourseOutcomes.get(c.courseCode) === 'fail');
    return failedCore.map(c => c.courseName).join(', ');
  }

  get hasModalCoreFailed(): boolean {
    return !!this.failedCoreCoursesList;
  }

  get modalSaveLabel(): string {
    if (this.hasModalCoreFailed) {
      return 'Send to Kafaat Committee';
    }
    return `Save & move to ${this.nextSemesterName}`;
  }

  openUpdateStatusModal(): void {
    if (this.isNgoUser) return;
    const regId = this.activeRegistration?.academicRegistrationId;
    if (!regId) {
      const activeReg = this.activeRegistration;
      this.modalGpa = activeReg?.semesterResult?.semesterGpa ?? this.results?.semesterGpa ?? null;
      this.modalNote = this.results?.internalNote ?? '';
      this.modalExpectedUpdatedOn = this.results?.expectedUpdatedOn ?? activeReg?.semesterResult?.updatedOn ?? null;
      this.modalCourses = this.activeCourses;
      this.isUpdateStatusModalOpen = true;
      return;
    }

    this.academicRegistrationService.getResults(regId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          const r = res.result;
          this.results = r;
          this.modalExpectedUpdatedOn = r.expectedUpdatedOn;
          this.modalGpa = r.semesterGpa;
          this.modalNote = r.internalNote || '';
          this.modalCourses = r.courses && r.courses.length > 0 ? r.courses : this.activeCourses;
          this.loadSemesterSchedule(r);
        } else {
          this.modalExpectedUpdatedOn = this.results?.expectedUpdatedOn ?? this.activeRegistration?.semesterResult?.updatedOn ?? null;
          this.modalGpa = this.results?.semesterGpa ?? this.activeRegistration?.semesterResult?.semesterGpa ?? null;
          this.modalNote = this.results?.internalNote ?? '';
          this.modalCourses = this.activeCourses;
        }
        this.isUpdateStatusModalOpen = true;
      },
      error: () => {
        this.modalExpectedUpdatedOn = this.results?.expectedUpdatedOn ?? this.activeRegistration?.semesterResult?.updatedOn ?? null;
        this.modalGpa = this.results?.semesterGpa ?? this.activeRegistration?.semesterResult?.semesterGpa ?? null;
        this.modalNote = this.results?.internalNote ?? '';
        this.modalCourses = this.activeCourses;
        this.isUpdateStatusModalOpen = true;
      }
    });
  }

  closeUpdateStatusModal(): void {
    if (this.isSavingModalResults) return;
    this.isUpdateStatusModalOpen = false;
  }

  async handleModalSaveResults(event: SemesterResultsSaveEvent): Promise<void> {
    const regId = event.academicRegistrationId || this.activeRegistration?.academicRegistrationId;
    if (!regId) {
      this.notification.error('No active academic registration found to save.');
      return;
    }

    this.isSavingModalResults = true;
    const requestModel: SaveAcademicResultsRequestModel = {
      semesterGpa: event.gpa,
      internalNote: event.note || null,
      expectedUpdatedOn: event.expectedUpdatedOn,
      courseResults: event.courseResults
    };

    const currentSemNo = event.semesterNo || this.activeRegistration?.semesterNo || this.results?.semesterNo || 1;
    const maxSemesters = this.totalProgramSemesters || this.program?.numberOfSemesters || 6;
    const hasNextSemester = currentSemNo < maxSemesters;
    const allowProgression = !event.hasCoreFailed && (!!this.nextSemesterSchedule || hasNextSemester);

    try {
      const result = await this.academicRegistrationService.saveFinalizeAndProgress(
        regId,
        requestModel,
        allowProgression
      );

      this.isSavingModalResults = false;
      this.closeUpdateStatusModal();

      if (event.hasCoreFailed) {
        this.notification.success(
          'Semester results finalized. A failing-core case has been submitted for Committee review.'
        );
        this.loadAcademicHistory(regId);
      } else if (result.progression) {
        const prog: any = result.progression;
        const nextRegId = prog.academicRegistrationId || prog.AcademicRegistrationId;
        const nextName = prog.nextSemesterName || prog.NextSemesterName || `Semester ${prog.nextSemesterNo || prog.NextSemesterNo || currentSemNo + 1}`;
        this.notification.success(
          `Results finalized and student registered for ${nextName} successfully.`
        );
        this.loadAcademicHistory(nextRegId);
      } else {
        this.notification.success('Semester results saved and finalized successfully.');
        this.loadAcademicHistory(regId);
      }
    } catch (error: any) {
      this.isSavingModalResults = false;
      const message = this.apiErrorMessage(error, 'Failed to save academic results.');

      if (error?.status === 409) {
        this.notification.warning(`${message} Reloading the latest saved results from server...`);
        this.academicRegistrationService.getResults(regId).subscribe({
          next: (res) => {
            if (res.success && res.result) {
              const r = res.result;
              this.results = r;
              this.modalExpectedUpdatedOn = r.expectedUpdatedOn;
              this.modalGpa = r.semesterGpa;
              this.modalNote = r.internalNote || '';
              this.modalCourses = r.courses && r.courses.length > 0 ? r.courses : this.activeCourses;
            }
          }
        });
        return;
      }

      if (!this.notification.handleBusinessError(error, message)) {
        this.notification.error(message);
      }
    }
  }

  setModalCourseResult(courseCode: string, result: 'pass' | 'fail'): void {
    this.modalCourseOutcomes.set(courseCode, result);
  }

  markAllAsPass(): void {
    for (const c of this.activeCourses) {
      this.modalCourseOutcomes.set(c.courseCode, 'pass');
    }
  }

  get canEditResults(): boolean {
    return !!this.results && !this.resultsRequiresRefresh && !this.isFinalizingResults && !this.isProgressingRegistration &&
      (this.results.submissionStatus === null || this.results.submissionStatus === 'Draft');
  }

  get hasUnsavedDraftChanges(): boolean {
    if (!this.results || !this.savedDraftSnapshot) return false;
    return this.results.semesterGpa !== this.savedDraftSnapshot.semesterGpa ||
      (this.results.internalNote ?? '') !== this.savedDraftSnapshot.internalNote ||
      this.results.courses.length !== this.savedDraftSnapshot.courseOutcomes.size ||
      this.results.courses.some(course =>
        this.savedDraftSnapshot?.courseOutcomes.get(course.studentCourseEnrollmentId) !== course.isPassed);
  }

  get canFinalizeResults(): boolean {
    return !!this.results && this.results.submissionStatus === 'Draft' &&
      !this.resultsRequiresRefresh && !this.isSavingResults && !this.isFinalizingResults && !this.isProgressingRegistration &&
      !this.hasUnsavedDraftChanges && !this.validateResults();
  }

  get hasFailedCourses(): boolean {
    return !!this.results?.courses.some(course => course.isPassed === false);
  }

  get isProgressionEligible(): boolean {
    return !!this.results &&
      this.results.submissionStatus === 'Finalized' &&
      !this.resultsRequiresRefresh &&
      !this.resultsLoading &&
      !this.isSavingResults &&
      !this.isFinalizingResults &&
      !this.isProgressingRegistration &&
      this.results.programSemesterId !== null &&
      this.results.courses.length > 0 &&
      !this.results.courses.some(course => course.courseType === ProgramCourseType.Core && course.isPassed === false) &&
      !!this.semesterSchedule &&
      this.semesterSchedule.programSemesterId === this.results.programSemesterId &&
      !!this.nextSemesterSchedule &&
      this.nextSemesterSchedule.semesterNo === this.results.semesterNo + 1;
  }

  get semesterGpa(): number | null {
    return this.results?.semesterGpa ?? null;
  }

  set semesterGpa(value: number | null) {
    if (this.results) this.results.semesterGpa = value;
  }

  get internalNote(): string {
    return this.results?.internalNote ?? '';
  }

  set internalNote(value: string) {
    if (this.results) this.results.internalNote = value;
  }

  loadAcademicHistory(preferredRegistrationId?: number): void {
    const requestVersion = ++this.historyRequestVersion;
    this.historyLoading = true;
    this.historyState = 'loading';
    this.historyMessage = '';
    this.history = null;
    this.selectedAcademicRegistrationId = null;
    this.clearSelectedResults();

    this.academicRegistrationService.getHistoryByApplication(this.applicationId).subscribe({
      next: (res) => {
        if (requestVersion !== this.historyRequestVersion) return;
        this.historyLoading = false;
        if (res.success && res.result) {
          this.history = res.result;
          this.historyState = 'loaded';
          if (preferredRegistrationId && res.result.registrations.some(x => x.academicRegistrationId === preferredRegistrationId)) {
            this.selectAcademicRegistration(preferredRegistrationId);
          } else if (res.result.registrations.length > 0) {
            this.selectAcademicRegistration(res.result.registrations[res.result.registrations.length - 1].academicRegistrationId);
          } else {
            this.resultsState = 'idle';
          }
          return;
        }
        this.history = null;
        this.historyState = 'error';
        this.historyMessage = res.message || 'Failed to load academic history.';
        this.notification.error(this.historyMessage);
      },
      error: (error) => {
        if (requestVersion !== this.historyRequestVersion) return;
        this.historyLoading = false;
        this.history = null;
        this.setHistoryError(error, 'Failed to load academic history.');
      }
    });
  }

  selectAcademicRegistration(academicRegistrationId: number): void {
    if (this.isSavingResults || this.isFinalizingResults || this.isProgressingRegistration ||
        !this.history?.registrations.some(x => x.academicRegistrationId === academicRegistrationId)) return;

    if (this.selectedAcademicRegistrationId === academicRegistrationId &&
        (this.resultsState === 'loading' || this.resultsState === 'loaded')) return;

    this.selectedAcademicRegistrationId = academicRegistrationId;
    this.clearSelectedResults();
    this.resultsState = 'loading';
    this.resultsLoading = true;
    const requestVersion = ++this.resultsRequestVersion;

    this.academicRegistrationService.getResults(academicRegistrationId).subscribe({
      next: (res) => {
        if (requestVersion !== this.resultsRequestVersion ||
            this.selectedAcademicRegistrationId !== academicRegistrationId) return;
        this.resultsLoading = false;
        if (res.success && res.result && res.result.academicRegistrationId === academicRegistrationId) {
          this.setResults(res.result);
          this.loadSemesterSchedule(res.result);
          return;
        }
        this.results = null;
        this.resultsState = 'error';
        this.resultsMessage = res.message || 'The selected academic registration could not be loaded.';
      },
      error: (error) => {
        if (requestVersion !== this.resultsRequestVersion ||
            this.selectedAcademicRegistrationId !== academicRegistrationId) return;
        this.resultsLoading = false;
        this.results = null;
        this.setResultsError(error, 'The selected academic registration could not be loaded.');
      }
    });
  }

  retrySelectedRegistration(): void {
    if (this.selectedAcademicRegistrationId !== null && !this.isSavingResults && !this.isFinalizingResults && !this.isProgressingRegistration) {
      this.selectAcademicRegistration(this.selectedAcademicRegistrationId);
    }
  }

  historyStatus(registration: AcademicHistoryRegistrationModel): string {
    return registration.semesterResult?.submissionStatus || 'No result record';
  }

  courseTypeName(courseType: number): string {
    switch (courseType) {
      case ProgramCourseType.Core: return 'Core';
      case ProgramCourseType.Elective: return 'Elective';
      default: return 'Course';
    }
  }

  saveResults(): void {
    if (!this.results || !this.canEditResults || this.isSavingResults || this.isFinalizingResults) return;

    this.validationMessage = this.validateResults();
    if (this.validationMessage) {
      this.notification.warning(this.validationMessage);
      return;
    }

    const registrationId = this.results.academicRegistrationId;
    const request: SaveAcademicResultsRequestModel = {
      semesterGpa: this.results.semesterGpa,
      internalNote: this.results.internalNote,
      expectedUpdatedOn: this.results.expectedUpdatedOn,
      courseResults: this.results.courses.map(course => ({
        studentCourseEnrollmentId: course.studentCourseEnrollmentId,
        isPassed: course.isPassed as boolean
      }))
    };

    this.isSavingResults = true;
    this.academicRegistrationService.saveResults(registrationId, request).subscribe({
      next: (res) => {
        this.isSavingResults = false;
        if (!res.success) {
          this.notification.error(res.message || 'Failed to save academic results.');
          return;
        }
        this.notification.success(res.message || 'Draft academic results saved.');
        this.reloadResultsByRegistration(registrationId);
      },
      error: (error) => {
        this.isSavingResults = false;
        const message = this.apiErrorMessage(error, 'Failed to save academic results.');
        if (error?.status === 409) {
          this.resultsRequiresRefresh = true;
          this.resultsRefreshMessage = `${message} Your current values are still shown. Load the latest server results before saving again.`;
          this.notification.warning(this.resultsRefreshMessage);
          return;
        }
        if (error?.status === 401 || error?.status === 403) {
          this.resultsState = 'unauthorized';
          this.resultsMessage = message;
          this.notification.error(message);
          return;
        }
        if (error?.status === 404) {
          this.resultsState = 'not-found';
          this.resultsMessage = message;
          this.notification.error(message);
          return;
        }
        if (!this.notification.handleBusinessError(error, message)) this.notification.error(message);
      }
    });
  }

  async finalizeResults(): Promise<void> {
    if (!this.results || !this.canFinalizeResults) return;

    const registrationId = this.results.academicRegistrationId;
    const loadedResults = this.results;
    const request: FinalizeAcademicResultsRequestModel = {
      expectedUpdatedOn: this.results.expectedUpdatedOn
    };

    this.isFinalizingResults = true;
    let confirmed = false;
    try {
      confirmed = await this.confirmDialog.confirm({
        title: 'Finalize semester results?',
        message: 'Finalized results become read-only in the normal results editor. Continue?',
        confirmText: 'Finalize Results',
        cancelText: 'Cancel',
        variant: 'warning'
      });
    } catch {
      this.isFinalizingResults = false;
      this.notification.error('Could not open the finalization confirmation.');
      return;
    }

    if (!confirmed) {
      this.isFinalizingResults = false;
      return;
    }

    if (this.results !== loadedResults || this.selectedAcademicRegistrationId !== registrationId) {
      this.isFinalizingResults = false;
      return;
    }

    this.academicRegistrationService.finalizeResults(registrationId, request).subscribe({
      next: (res) => {
        this.isFinalizingResults = false;
        if (!res.success || !res.result ||
            res.result.academicRegistrationId !== registrationId ||
            res.result.submissionStatus !== 'Finalized') {
          this.resultsRequiresRefresh = true;
          this.resultsRefreshMessage = res.message || 'Finalization could not be confirmed. Reload the saved results before continuing.';
          this.notification.error(this.resultsRefreshMessage);
          return;
        }

        this.setResults(res.result);
        const historyRegistration = this.history?.registrations.find(
          registration => registration.academicRegistrationId === registrationId);
        if (historyRegistration?.semesterResult) {
          historyRegistration.semesterResult.submissionStatus = res.result.submissionStatus ?? 'Finalized';
          historyRegistration.semesterResult.submittedOn = res.result.submittedOn;
          historyRegistration.semesterResult.updatedOn = res.result.expectedUpdatedOn;
        }
        this.notification.success(res.message || 'Semester results finalized successfully.');
      },
      error: (error) => {
        this.isFinalizingResults = false;
        const message = this.apiErrorMessage(error, 'Failed to finalize semester results.');
        if (error?.status === 409) {
          this.resultsRequiresRefresh = true;
          this.resultsRefreshMessage = `${message} Your current values are still shown. Load the latest server results before trying again.`;
          this.notification.warning(this.resultsRefreshMessage);
          return;
        }
        if (error?.status === 401 || error?.status === 403) {
          this.resultsState = 'unauthorized';
          this.resultsMessage = message;
          this.notification.error(message);
          return;
        }
        if (error?.status === 404) {
          this.resultsState = 'not-found';
          this.resultsMessage = message;
          this.notification.error(message);
          return;
        }
        if (!this.notification.handleBusinessError(error, message)) this.notification.error(message);
      }
    });
  }

  async progressToNextSemester(): Promise<void> {
    if (!this.results || !this.isProgressionEligible) return;

    const previousRegistrationId = this.results.academicRegistrationId;
    const selectedResults = this.results;
    const nextSemesterName = this.nextSemesterSchedule?.semesterName || `Semester ${this.results.semesterNo + 1}`;
    this.isProgressingRegistration = true;

    try {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Register for the next semester?',
        message: `The finalized results are all passing. Create a registration for ${nextSemesterName} and enroll its active configured courses?`,
        confirmText: 'Continue',
        cancelText: 'Cancel',
        variant: 'warning'
      });
      if (!confirmed) return;
      if (this.results !== selectedResults || this.selectedAcademicRegistrationId !== previousRegistrationId) return;

      let confirmedRestrictionCodes: string[] = [];
      for (let attempt = 0; attempt < 3; attempt++) {
        const request: ProgressAcademicRegistrationRequestModel = { confirmedRegistrationRestrictionCodes: confirmedRestrictionCodes };
        const response = await firstValueFrom(
          this.academicRegistrationService.progressToNextSemester(previousRegistrationId, request)
        );

        if (!response.success || !response.result) {
          throw new Error(response.message || 'The progression request could not be completed.');
        }

        const progression: AcademicProgressionResponseModel = response.result;
        if (progression.confirmationRequired) {
          const warningText = progression.warnings.map(warning => `• ${warning.message}`).join('\n');
          const warningsConfirmed = await this.confirmDialog.confirm({
            title: 'Registration restriction',
            message: `${warningText}\n\nContinue for this development phase? The server will revalidate the registration before saving.`,
            confirmText: 'Continue anyway',
            cancelText: 'Cancel',
            variant: 'warning'
          });
          if (!warningsConfirmed) return;

          confirmedRestrictionCodes = progression.warnings.map(warning => warning.code);
          continue;
        }

        if (!progression.academicRegistrationId) {
          throw new Error('The server did not return the created academic registration.');
        }

        this.isProgressingRegistration = false;
        this.notification.success(
          `Registered for ${progression.nextSemesterName || `Semester ${progression.nextSemesterNo}`} with ${progression.enrollmentSummary?.newlyCreatedCount ?? 0} course enrollments.`
        );
        this.loadAcademicHistory(progression.academicRegistrationId);
        return;
      }

      this.notification.warning('Registration conditions changed repeatedly. Review the current record and try again.');
    } catch (error: any) {
      const message = this.apiErrorMessage(error, 'Failed to register the student for the next semester.');
      if (error?.status === 409) {
        this.notification.warning(`${message} The current results remain visible; refresh Academic History before retrying.`);
      } else if (error?.status === 401 || error?.status === 403) {
        this.notification.error(message);
      } else if (!this.notification.handleBusinessError(error, message)) {
        this.notification.error(message);
      }
    } finally {
      this.isProgressingRegistration = false;
    }
  }

  private validateResults(): string {
    if (!this.results || this.results.courses.length === 0)
      return 'There are no enrolled courses to save for this semester.';
    if (this.results.courses.some(course => course.isPassed !== true && course.isPassed !== false))
      return 'Select Pass or Fail for every enrolled course.';

    const gpa = this.results.semesterGpa;
    if (gpa !== null && (!Number.isFinite(gpa) || gpa < 0 || gpa > 4 ||
      Math.abs(gpa * 100 - Math.round(gpa * 100)) > 0.0000001))
      return 'Semester GPA must be between 0.00 and 4.00 with no more than two decimal places.';
    if ((this.results.internalNote?.length ?? 0) > 1000)
      return 'The semester note cannot exceed 1,000 characters.';
    return '';
  }

  reloadLatestResults(): void {
    if (!this.results || this.resultsLoading || this.isSavingResults || this.isFinalizingResults || this.isProgressingRegistration ||
        this.results.academicRegistrationId !== this.selectedAcademicRegistrationId) return;
    this.reloadResultsByRegistration(this.results.academicRegistrationId);
  }

  private reloadResultsByRegistration(registrationId: number): void {
    const requestVersion = ++this.resultsRequestVersion;
    this.resultsLoading = true;
    this.resultsRequiresRefresh = true;
    this.resultsRefreshMessage = 'Refreshing the saved results. The current values will remain visible until the latest response is received.';
    this.academicRegistrationService.getResults(registrationId).subscribe({
      next: (res) => {
        if (requestVersion !== this.resultsRequestVersion ||
            this.selectedAcademicRegistrationId !== registrationId) return;
        this.resultsLoading = false;
        if (res.success && res.result) {
          this.setResults(res.result);
          this.loadSemesterSchedule(res.result);
          return;
        }
        this.resultsRequiresRefresh = true;
        this.resultsRefreshMessage = res.message || 'Failed to reload the latest academic results. Your current values are still shown.';
        this.notification.error(this.resultsRefreshMessage);
      },
      error: (error) => {
        if (requestVersion !== this.resultsRequestVersion ||
            this.selectedAcademicRegistrationId !== registrationId) return;
        this.resultsLoading = false;
        this.resultsRequiresRefresh = true;
        this.resultsRefreshMessage = this.apiErrorMessage(error, 'Failed to reload the latest academic results. Your current values are still shown.');
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
          this.resultsState = error.status === 404 ? 'not-found' : 'unauthorized';
          this.resultsMessage = this.resultsRefreshMessage;
          this.notification.error(this.resultsRefreshMessage);
        } else if (!this.notification.handleBusinessError(error, this.resultsRefreshMessage)) {
          this.notification.error(this.resultsRefreshMessage);
        }
      }
    });
  }

  private setResults(result: AcademicRegistrationResultsModel): void {
    const loadedResults: AcademicRegistrationResultsModel = {
      ...result,
      courses: result.courses ?? []
    };
    this.results = loadedResults;
    this.resultsState = 'loaded';
    this.resultsMessage = '';
    this.validationMessage = '';
    this.resultsRequiresRefresh = false;
    this.resultsRefreshMessage = '';
    this.savedDraftSnapshot = {
      semesterGpa: loadedResults.semesterGpa,
      internalNote: loadedResults.internalNote ?? '',
      courseOutcomes: new Map(loadedResults.courses.map(course => [course.studentCourseEnrollmentId, course.isPassed]))
    };
  }

  private clearSelectedResults(): void {
    this.resultsRequestVersion++;
    this.results = null;
    this.semesterSchedule = null;
    this.nextSemesterSchedule = null;
    this.scheduleLoading = false;
    this.scheduleUnavailable = false;
    this.resultsLoading = false;
    this.resultsState = 'idle';
    this.resultsMessage = '';
    this.resultsRequiresRefresh = false;
    this.resultsRefreshMessage = '';
    this.validationMessage = '';
    this.savedDraftSnapshot = null;
  }

  private loadSemesterSchedule(result: AcademicRegistrationResultsModel): void {
    const requestVersion = this.resultsRequestVersion;
    const registrationId = result.academicRegistrationId;
    this.scheduleLoading = true;
    this.scheduleUnavailable = false;
    this.semesterSchedule = null;
    this.programService.getSemesterByProgramId(result.programId).subscribe({
      next: (res) => {
        if (requestVersion !== this.resultsRequestVersion ||
            registrationId !== this.selectedAcademicRegistrationId) return;
        this.scheduleLoading = false;
        const semesters = res.success ? (res.result ?? []) : [];
        const matching = semesters.filter(semester => semester.semesterNo === result.semesterNo);
        const selected = result.programSemesterId
          ? matching.filter(semester => semester.programSemesterId === result.programSemesterId)
          : matching;
        if (selected.length === 1) {
          this.semesterSchedule = selected[0];
          const next = semesters.filter(semester => semester.semesterNo === result.semesterNo + 1);
          this.nextSemesterSchedule = next.length === 1 ? next[0] : null;
          this.scheduleUnavailable = !selected[0].termName && !selected[0].academicYearName &&
            !(selected[0].startDate && selected[0].endDate);
        } else {
          this.scheduleUnavailable = true;
          this.nextSemesterSchedule = null;
        }
      },
      error: () => {
        if (requestVersion !== this.resultsRequestVersion ||
            registrationId !== this.selectedAcademicRegistrationId) return;
        this.scheduleLoading = false;
        this.scheduleUnavailable = true;
        this.nextSemesterSchedule = null;
      }
    });
  }

  private setResultsError(error: any, fallback: string): void {
    this.resultsMessage = this.apiErrorMessage(error, fallback);
    if (error?.status === 404) this.resultsState = 'not-found';
    else if (error?.status === 401 || error?.status === 403) this.resultsState = 'unauthorized';
    else if (error?.status === 409) this.resultsState = 'conflict';
    else this.resultsState = 'error';
    if (this.resultsState !== 'not-found' &&
        !this.notification.handleBusinessError(error, this.resultsMessage)) {
      this.notification.error(this.resultsMessage);
    }
  }

  private setHistoryError(error: any, fallback: string): void {
    this.historyMessage = this.apiErrorMessage(error, fallback);
    if (error?.status === 404) this.historyState = 'not-found';
    else if (error?.status === 401 || error?.status === 403) this.historyState = 'unauthorized';
    else if (error?.status === 409) this.historyState = 'conflict';
    else this.historyState = 'error';
    if (this.historyState !== 'not-found' &&
        !this.notification.handleBusinessError(error, this.historyMessage)) {
      this.notification.error(this.historyMessage);
    }
  }

  private apiErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  handlePhotoError(): void {
    this.photoError = true;
  }

  getBadgeClass(): string {
    if (!this.student) return '';
    return this.studentStatusService.getBadgeClass(this.student.applicationStatusId);
  }

  getStatusName(): string {
    if (!this.student) return '';
    return this.studentStatusService.getName(this.student.applicationStatusId);
  }

  goBack(): void {
    const targetId = this.student?.studentId || this.applicationId;
    if (targetId) {
      if (this.isNgoUser) {
        this.router.navigate(['/ngo-student-details', targetId]);
      } else {
        this.router.navigate(['/registered-student', this.applicationId]);
      }
    } else {
      if (this.isNgoUser) {
        this.router.navigate(['/ngo-students']);
      } else {
        this.router.navigate(['/university-students']);
      }
    }
  }

  getInitials(): string {
    if (!this.student) return '?';
    return (this.student.firstName ? this.student.firstName.charAt(0).toUpperCase() : '') +
           (this.student.lastName ? this.student.lastName.charAt(0).toUpperCase() : '');
  }

}
