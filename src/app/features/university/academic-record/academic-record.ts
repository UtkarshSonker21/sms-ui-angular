import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

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

@Component({
  selector: 'app-academic-record',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  applicationId: number = 0;
  student: StudentProgramApplication | null = null;
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
          this.photoError = false;
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
      this.results.courses.every(course => course.isPassed === true) &&
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
          } else if (res.result.registrations.length === 1) {
            this.selectAcademicRegistration(res.result.registrations[0].academicRegistrationId);
          } else if (res.result.registrations.length === 0) {
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
    if (this.applicationId) {
        this.router.navigate(['/registered-student', this.applicationId]);
    } else {
        this.router.navigate(['/university-students']);
    }
  }

  getInitials(): string {
    if (!this.student) return '?';
    return (this.student.firstName ? this.student.firstName.charAt(0).toUpperCase() : '') +
           (this.student.lastName ? this.student.lastName.charAt(0).toUpperCase() : '');
  }

}
