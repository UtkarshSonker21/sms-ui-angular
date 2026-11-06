import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { StaffType } from '../../../core/enums/staff-type.enum';
import { AcademicRegistrationService } from '../../../core/services/university/academic-registration.service';
import { AcademicHistoryModel, AcademicHistoryRegistrationModel } from '../../../core/models/university/academic-registration/academic-history.model';
import { SponsorshipAssignmentService } from '../../../core/services/ngo/sponsorship-assignment.service';
import { SponsorshipAssignment } from '../../../core/models/ngo/sponsorshipMatrix/sponsorship-assignment.model';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramSemester } from '../../../core/models/university/programs/program-semester.model';
import { SemesterResultsDialog, SemesterResultsSaveEvent } from '../semester-results-dialog/semester-results-dialog';
import { SaveAcademicResultsRequestModel } from '../../../core/models/university/academic-registration/academic-results.model';

@Component({
  selector: 'app-registered-student',
  standalone: true,
  imports: [CommonModule, FormsModule, SemesterResultsDialog],
  templateUrl: './registered-student.html',
  styleUrls: ['./registered-student.scss', '../university-students/university-students.scss']
})
export class RegisteredStudent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private studentProgramService = inject(StudentProgramService);
  private studentStatusService = inject(StudentStatusService);
  private userProfileService = inject(CurrentUserProfileService);
  private academicRegistrationService = inject(AcademicRegistrationService);
  private sponsorshipAssignmentService = inject(SponsorshipAssignmentService);
  private programService = inject(ProgramService);

  studentStatus = StudentStatusEnum;
  applicationId: number = 0;
  student: StudentProgramApplication | null = null;
  academicHistory: AcademicHistoryModel | null = null;
  sponsorshipAssignment: SponsorshipAssignment | null = null;
  program: ProgramRequest | null = null;
  programSemesters: ProgramSemester[] = [];

  photoError: boolean = false;
  isLoading: boolean = true;
  isNgoUser: boolean = false;

  // Status Update Modal
  showStatusModal: boolean = false;
  isSavingResults: boolean = false;
  modalExpectedUpdatedOn: string | null = null;
  modalGpa: number | null = null;
  modalNote: string = '';
  modalCourses: any[] = [];
  isLoadingModalResults: boolean = false;
  selectedStatusAction: string = 'Graduated';
  statusNotes: string = '';

  ngOnInit(): void {
    const profile = this.userProfileService.getCurrentUserProfile();
    if (profile && profile.staffType === StaffType.Ngo) {
      this.isNgoUser = true;
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        this.router.navigate(['/ngo-student-details', idParam]);
        return;
      }
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.applicationId = +idParam;
      this.loadStudentDetails();
    }
  }

  loadStudentDetails(): void {
    this.isLoading = true;
    this.studentProgramService.getById(this.applicationId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.student = res.result;
          this.photoError = false;

          // Double check they are registered
          if (this.student.applicationStatusId !== StudentStatusEnum.Registered) {
            this.notification.warning('Student is not in Registered status. Redirecting to application profile.');
            this.router.navigate(['/university-student-details', this.student.applicationId]);
            return;
          }

          // Load ancillary data concurrently: Academic History, Sponsorship Assignment (for NGO staff), Program details, Program Semesters
          const ancillaryCalls: {
            history: Observable<any>;
            program: Observable<any>;
            semesters?: Observable<any>;
            sponsorship?: Observable<any>;
          } = {
            history: this.academicRegistrationService.getHistoryByApplication(this.applicationId).pipe(
              catchError(() => of(null))
            ),
            program: this.student.programId ? this.programService.getProgramById(this.student.programId).pipe(
              catchError(() => of(null))
            ) : of(null),
            semesters: this.student.programId ? this.programService.getSemesterByProgramId(this.student.programId).pipe(
              catchError(() => of(null))
            ) : of(null)
          };

          if (this.isNgoUser) {
            ancillaryCalls.sponsorship = this.sponsorshipAssignmentService.getByApplication(this.applicationId).pipe(
              catchError(() => of(null))
            );
          }

          forkJoin(ancillaryCalls).subscribe({
            next: (data: any) => {
              this.isLoading = false;
              if (data.history && data.history.success && data.history.result) {
                this.academicHistory = data.history.result;
              }
              if (data.sponsorship && data.sponsorship.success && data.sponsorship.result && data.sponsorship.result.length > 0) {
                this.sponsorshipAssignment = data.sponsorship.result[0];
              }
              if (data.program && data.program.success && data.program.result) {
                this.program = data.program.result;
              }
              if (data.semesters && data.semesters.success && data.semesters.result) {
                this.programSemesters = data.semesters.result;
              }
            },
            error: () => {
              this.isLoading = false;
            }
          });

        } else {
          this.isLoading = false;
          this.notification.error(res.message || 'Failed to load student details.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notification.handleBusinessError(error, 'Failed to load student details.');
      }
    });
  }

  // --- Computed Properties & Academic Calculations ---

  get registrations(): AcademicHistoryRegistrationModel[] {
    return this.academicHistory?.registrations || [];
  }

  get reversedRegistrations(): AcademicHistoryRegistrationModel[] {
    return [...this.registrations].reverse();
  }

  get currentRegistration(): AcademicHistoryRegistrationModel | null {
    if (this.registrations.length === 0) return null;
    return this.registrations[this.registrations.length - 1];
  }

  get currentSemesterNo(): number | null {
    return this.currentRegistration?.semesterNo ?? null;
  }

  get currentSemesterTitle(): string {
    if (!this.currentRegistration) return 'N/A';
    return this.currentRegistration.semesterName || `Semester ${this.currentRegistration.semesterNo}`;
  }

  get nextSemesterSchedule(): ProgramSemester | null {
    if (!this.currentSemesterNo || !this.programSemesters?.length) return null;
    const next = this.programSemesters.filter(s => s.semesterNo === this.currentSemesterNo! + 1);
    return next.length === 1 ? next[0] : null;
  }

  get currentSemesterStatusText(): string {
    if (!this.currentRegistration) return 'Not registered';
    return this.currentRegistration.semesterResult?.submissionStatus === 'Finalized' ? 'Completed' : 'In progress';
  }

  get allEnrolledCourses() {
    return this.registrations.flatMap(r => r.courses || []);
  }

  get passedCourses() {
    return this.allEnrolledCourses.filter(c => c.isPassed === true);
  }

  get failedCourses() {
    return this.allEnrolledCourses.filter(c => c.isPassed === false);
  }

  get pendingCourses() {
    return this.allEnrolledCourses.filter(c => c.isPassed === null);
  }

  get creditsEarned(): number {
    return this.passedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  }

  get creditsRequired(): number | null {
    return (this.program?.creditsRequired && this.program.creditsRequired > 0)
      ? this.program.creditsRequired
      : null;
  }

  get creditsRemaining(): number | null {
    if (this.creditsRequired !== null && this.creditsRequired > 0) {
      return Math.max(0, this.creditsRequired - this.creditsEarned);
    }
    return null;
  }

  get currentSemesterCredits(): number | null {
    if (!this.currentRegistration) return null;
    return (this.currentRegistration.courses || []).reduce((sum, c) => sum + (c.credits || 0), 0);
  }

  get percentComplete(): number | null {
    if (this.creditsRequired !== null && this.creditsRequired > 0) {
      return Math.min(100, Math.round((this.creditsEarned / this.creditsRequired) * 100));
    }
    return null;
  }

  get completedSemestersCount(): number {
    return this.registrations.filter(r => r.semesterResult?.submissionStatus === 'Finalized').length;
  }

  get totalProgramSemesters(): number | null {
    return (this.program?.numberOfSemesters && this.program.numberOfSemesters > 0)
      ? this.program.numberOfSemesters
      : null;
  }

  get semestersCompletedDisplay(): string {
    if (this.totalProgramSemesters !== null) {
      return `${this.completedSemestersCount} / ${this.totalProgramSemesters}`;
    }
    return '-';
  }

  get creditsCompletedDisplay(): string {
    if (this.creditsRequired !== null) {
      return `${this.creditsEarned} / ${this.creditsRequired}`;
    }
    return '-';
  }

  get currentSemesterCreditsDisplay(): string {
    return this.currentSemesterCredits !== null && this.currentSemesterCredits !== undefined
      ? `${this.currentSemesterCredits}`
      : '-';
  }

  get creditsRemainingDisplay(): string {
    return this.creditsRemaining !== null ? `${this.creditsRemaining}` : '-';
  }

  get percentCompleteDisplay(): string {
    return this.percentComplete !== null ? `${this.percentComplete}%` : '-';
  }

  get currentYear(): number {
    return Math.max(1, Math.ceil((this.currentSemesterNo || 1) / 2));
  }

  get totalYears(): number | null {
    if (this.totalProgramSemesters !== null) {
      return Math.max(1, Math.ceil(this.totalProgramSemesters / 2));
    }
    return null;
  }

  get sponsorshipYearDisplay(): string {
    if (this.totalYears !== null) {
      return `Year ${this.currentYear} of ${this.totalYears}`;
    }
    return `Year ${this.currentYear}`;
  }

  get cumulativeGpa(): number | null {
    const gradedRegistrations = this.registrations.filter(r =>
      r.semesterResult?.semesterGpa !== null && r.semesterResult?.semesterGpa !== undefined
    );
    if (gradedRegistrations.length === 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;
    for (const reg of gradedRegistrations) {
      const semCredits = (reg.courses || []).reduce((s, c) => s + (c.credits || 0), 0) || 1;
      totalPoints += (reg.semesterResult!.semesterGpa! * semCredits);
      totalCredits += semCredits;
    }
    return totalCredits > 0 ? (totalPoints / totalCredits) : null;
  }

  get gpaSubtitle(): string {
    if (this.creditsRequired !== null && this.creditsRequired > 0) {
      return `${this.creditsEarned} of ${this.creditsRequired} credit hours · Year ${this.currentYear}${this.totalYears ? ' of ' + this.totalYears : ''}`;
    }
    if (this.creditsEarned > 0) {
      return `${this.creditsEarned} credit hours earned · Year ${this.currentYear}`;
    }
    return this.totalYears ? `Year ${this.currentYear} of ${this.totalYears}` : `Year ${this.currentYear}`;
  }

  get registrationDate(): string | null {
    if (this.currentRegistration?.registrationDate) {
      return this.currentRegistration.registrationDate;
    }
    if (this.registrations.length > 0 && this.registrations[0].registrationDate) {
      return this.registrations[0].registrationDate;
    }
    return null;
  }

  get sponsorshipDate(): string | null {
    if (this.sponsorshipAssignment?.assignedDate) {
      return this.sponsorshipAssignment.assignedDate as any;
    }
    return this.registrationDate || (this.student?.actionDate ? (this.student.actionDate as any) : null);
  }

  get sponsorName(): string {
    return this.sponsorshipAssignment?.donorName || this.student?.donorName || 'Direct Aid Society — Kafaat';
  }

  get coverageText(): string {
    return this.sponsorshipAssignment?.sponsorshipName || this.student?.sponsorshipCategoryName || 'Full · Tuition · Allowances';
  }

  get sponsorshipNotes(): string {
    return this.sponsorshipAssignment?.remarks || 'Good academic standing — eligible for full sponsorship continuation.';
  }

  get spStatus(): string {
    return 'Active';
  }

  // --- Photo & Status Helpers ---

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  handlePhotoError(): void {
    this.photoError = true;
  }

  goBack(): void {
    this.router.navigate(['/university-students'], {
      queryParams: { tab: StudentStatusEnum.Registered }
    });
  }

  viewUniversityStudentDetails(): void {
    if (this.student) {
      this.router.navigate(['/university-student-details', this.student.applicationId]);
    }
  }

  viewAcademicRecord(): void {
    if (this.applicationId) {
      this.router.navigate(['/registered-student', this.applicationId, 'academic-record']);
    }
  }

  getBadgeClass(): string {
    if (!this.student) return '';
    return this.studentStatusService.getBadgeClass(this.student.applicationStatusId);
  }

  getStatusName(): string {
    if (!this.student) return '';
    return this.student.applicationStatusName || this.studentStatusService.getName(this.student.applicationStatusId);
  }

  getInitials(): string {
    if (!this.student) return '?';
    return (this.student.firstName ? this.student.firstName.charAt(0).toUpperCase() : '') +
           (this.student.lastName ? this.student.lastName.charAt(0).toUpperCase() : '');
  }

  // --- Status Modal Actions ---

  openStatusModal(): void {
    const regId = this.currentRegistration?.academicRegistrationId;
    if (!regId) {
      this.modalExpectedUpdatedOn = null;
      this.modalGpa = null;
      this.modalNote = '';
      this.modalCourses = [];
      this.showStatusModal = true;
      return;
    }

    this.isLoadingModalResults = true;
    this.academicRegistrationService.getResults(regId).subscribe({
      next: (res) => {
        this.isLoadingModalResults = false;
        if (res.success && res.result) {
          const r = res.result;
          this.modalExpectedUpdatedOn = r.expectedUpdatedOn;
          this.modalGpa = r.semesterGpa;
          this.modalNote = r.internalNote || '';
          this.modalCourses = r.courses && r.courses.length > 0 ? r.courses : (this.currentRegistration?.courses || []);
        } else {
          this.modalExpectedUpdatedOn = this.currentRegistration?.semesterResult?.updatedOn ?? null;
          this.modalGpa = this.currentRegistration?.semesterResult?.semesterGpa ?? null;
          this.modalNote = '';
          this.modalCourses = this.currentRegistration?.courses || [];
        }
        this.showStatusModal = true;
      },
      error: () => {
        this.isLoadingModalResults = false;
        this.modalExpectedUpdatedOn = this.currentRegistration?.semesterResult?.updatedOn ?? null;
        this.modalGpa = this.currentRegistration?.semesterResult?.semesterGpa ?? null;
        this.modalNote = '';
        this.modalCourses = this.currentRegistration?.courses || [];
        this.showStatusModal = true;
      }
    });
  }

  closeStatusModal(): void {
    if (this.isSavingResults) return;
    this.showStatusModal = false;
  }

  async handleSaveResults(event: SemesterResultsSaveEvent): Promise<void> {
    const regId = event.academicRegistrationId || this.currentRegistration?.academicRegistrationId;
    if (!regId) {
      this.notification.error('No active academic registration found to save.');
      return;
    }

    this.isSavingResults = true;
    const requestModel: SaveAcademicResultsRequestModel = {
      semesterGpa: event.gpa,
      internalNote: event.note || null,
      expectedUpdatedOn: event.expectedUpdatedOn,
      courseResults: event.courseResults
    };

    const currentSemNo = event.semesterNo || this.currentSemesterNo || 1;
    const maxSemesters = this.totalProgramSemesters || this.program?.numberOfSemesters || 6;
    const hasNextSemester = currentSemNo < maxSemesters;
    const allowProgression = !event.hasCoreFailed && (!!this.nextSemesterSchedule || hasNextSemester);

    try {
      const result = await this.academicRegistrationService.saveFinalizeAndProgress(
        regId,
        requestModel,
        allowProgression
      );

      this.isSavingResults = false;
      this.closeStatusModal();

      if (event.hasCoreFailed) {
        this.notification.success(
          'Semester results finalized. A failing-core case has been submitted for Committee review.'
        );
      } else if (result.progression) {
        const prog: any = result.progression;
        const nextName = prog.nextSemesterName || prog.NextSemesterName || `Semester ${prog.nextSemesterNo || prog.NextSemesterNo || currentSemNo + 1}`;
        this.notification.success(
          `Results finalized and student registered for ${nextName} successfully.`
        );
      } else {
        this.notification.success('Semester results saved and finalized successfully.');
      }

      this.loadStudentDetails();
    } catch (error: any) {
      this.isSavingResults = false;
      const message = error?.error?.message || error?.message || 'Failed to save academic results.';

      if (error?.status === 409) {
        this.notification.warning(`${message} Reloading the latest saved results from server...`);
        this.academicRegistrationService.getResults(regId).subscribe({
          next: (res) => {
            if (res.success && res.result) {
              const r = res.result;
              this.modalExpectedUpdatedOn = r.expectedUpdatedOn;
              this.modalGpa = r.semesterGpa;
              this.modalNote = r.internalNote || '';
              this.modalCourses = r.courses && r.courses.length > 0 ? r.courses : (this.currentRegistration?.courses || []);
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
}
