import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { StudentProgramService } from '../../../../core/services/school/student-program.service';
import { StudentProgramApplication } from '../../../../core/models/school/student-program-application/student-program-application.model';
import { ProgramService } from '../../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../../core/models/university/programs/program-request.model';
import { ProgramSemester } from '../../../../core/models/university/programs/program-semester.model';
import { ProgramCourse } from '../../../../core/models/university/programs/program-course.model';
import { AcademicRegistrationService } from '../../../../core/services/university/academic-registration.service';
import { RegisterStudentRequestModel } from '../../../../core/models/university/academic-registration/register-student-request.model';
import { UniversityRegistrationWindowService } from '../../../../core/services/university/university-registration-window.service';
import { UniversityRegistrationWindow } from '../../../../core/models/university/academic-registration/university-registration-window.model';
import { NotificationService } from '../../../../core/services/common/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-register-student',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register-student.html',
  styleUrl: './register-student.scss'
})
export class RegisterStudent implements OnInit {
  applicationId = 0;
  selectedSemesterNo = 1;

  student: StudentProgramApplication | null = null;
  program: ProgramRequest | null = null;
  semesters: ProgramSemester[] = [];
  activeCentralWindow?: UniversityRegistrationWindow;

  registrationDate: string = '';
  remarks: string = '';

  previewCheckedIds = new Set<number>();
  isLoading = true;
  isSubmitting = false;
  loadError = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentProgramService = inject(StudentProgramService);
  private programService = inject(ProgramService);
  private academicRegistrationService = inject(AcademicRegistrationService);
  private centralWindowService = inject(UniversityRegistrationWindowService);
  private notification = inject(NotificationService);
  private confirmDialog = inject(ConfirmDialogService);

  ngOnInit(): void {
    const today = new Date();
    this.registrationDate = today.toISOString().slice(0, 10);

    this.route.params.subscribe(params => {
      this.applicationId = Number(params['id']) || 0;
      this.route.queryParams.subscribe(queryParams => {
        if (queryParams['semester']) {
          this.selectedSemesterNo = Number(queryParams['semester']) || 1;
        }
        if (this.applicationId > 0) {
          this.loadData();
        } else {
          this.loadError = 'Invalid student application ID.';
          this.isLoading = false;
        }
      });
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.loadError = '';

    this.studentProgramService.getById(this.applicationId).subscribe({
      next: (res) => {
        if (!res.success || !res.result) {
          this.loadError = res.message || 'Failed to load student application details.';
          this.isLoading = false;
          return;
        }

        this.student = res.result;
        const programId = this.student.programId;

        if (!programId) {
          this.loadError = 'Student application has no program assigned.';
          this.isLoading = false;
          return;
        }

        forkJoin({
          programRes: this.programService.getProgramById(programId),
          semestersRes: this.programService.getSemesterByProgramId(programId),
          windowsRes: this.centralWindowService.getForUser()
        }).subscribe({
          next: ({ programRes, semestersRes, windowsRes }) => {
            this.isLoading = false;

            if (programRes.success && programRes.result) {
              this.program = programRes.result;
            }

            if (semestersRes.success && Array.isArray(semestersRes.result)) {
              this.semesters = semestersRes.result.sort((a, b) => (a.semesterNo || 0) - (b.semesterNo || 0));
            }

            if (windowsRes.success && windowsRes.result?.windows) {
              const now = Date.now();
              this.activeCentralWindow = windowsRes.result.windows.find(w => {
                if (!w.isOpen || !w.registrationFrom || !w.registrationTo) return false;
                const from = Date.parse(w.registrationFrom);
                const to = Date.parse(w.registrationTo);
                return !isNaN(from) && !isNaN(to) && from <= now && to >= now;
              });
            }

            this.initPreviewChecked();
          },
          error: (err) => {
            this.isLoading = false;
            this.loadError = 'Failed to load program or semester details.';
            this.notification.handleBusinessError(err, this.loadError);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = 'Failed to load student details.';
        this.notification.handleBusinessError(err, this.loadError);
      }
    });
  }

  get selectedSemester(): ProgramSemester | undefined {
    return this.semesters.find(s => s.semesterNo === this.selectedSemesterNo);
  }

  get courses(): ProgramCourse[] {
    if (!this.program?.courses) return [];
    return this.program.courses
      .filter(c => c.semesterNo === this.selectedSemesterNo)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }

  get totalCredits(): number {
    return this.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
  }

  get coreCoursesCount(): number {
    return this.courses.filter(c => c.courseType === 1).length;
  }

  get previewCheckedCount(): number {
    return this.courses.filter(c => this.previewCheckedIds.has(this.getCourseKey(c))).length;
  }

  get allCoursesChecked(): boolean {
    return this.courses.length > 0 && this.courses.every(c => this.previewCheckedIds.has(this.getCourseKey(c)));
  }

  getCourseKey(course: ProgramCourse): number {
    return course.programCourseId ?? course.courseId;
  }

  initPreviewChecked(): void {
    this.previewCheckedIds.clear();
    for (const c of this.courses) {
      this.previewCheckedIds.add(this.getCourseKey(c));
    }
  }

  toggleAllCourses(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.previewCheckedIds.clear();
    if (checked) {
      for (const c of this.courses) {
        this.previewCheckedIds.add(this.getCourseKey(c));
      }
    }
  }

  toggleCourse(course: ProgramCourse, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const key = this.getCourseKey(course);
    if (checked) {
      this.previewCheckedIds.add(key);
    } else {
      this.previewCheckedIds.delete(key);
    }
  }

  get pageSubtitle(): string {
    if (this.activeCentralWindow) {
      const label = this.activeCentralWindow.periodLabel || 'Open semester';
      const toDate = this.activeCentralWindow.registrationTo
        ? new Date(this.activeCentralWindow.registrationTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';
      return toDate ? `Open semester • ${label} • Registration open until ${toDate}` : `Open semester • ${label}`;
    }
    const prog = this.student?.programName || this.program?.programName || '';
    return prog ? `Semester ${this.selectedSemesterNo} • ${prog}` : `Semester ${this.selectedSemesterNo}`;
  }

  get studyPeriodRange(): string {
    if (this.selectedSemester?.startDate && this.selectedSemester?.endDate) {
      const start = new Date(this.selectedSemester.startDate);
      const end = new Date(this.selectedSemester.endDate);
      const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    if (this.selectedSemester?.startDate) {
      return new Date(this.selectedSemester.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return 'Not configured';
  }

  get studyPeriodWeeksText(): string {
    if (this.selectedSemester?.startDate && this.selectedSemester?.endDate) {
      const start = new Date(this.selectedSemester.startDate).getTime();
      const end = new Date(this.selectedSemester.endDate).getTime();
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      const weeks = Math.round(diffDays / 7);
      if (weeks > 0) return `${weeks} weeks`;
    }
    return this.selectedSemester?.termName || 'Configured period';
  }

  get averageSemesterCost(): number | null {
    if (!this.program?.costs || this.program.costs.length === 0) {
      return null;
    }

    // 1 = One Time, 2 = Semester (recurring)
    const semCosts = this.program.costs
      .filter(c => c.frequencyTypeId === 2 || (c.frequencyTypeId != null && c.frequencyTypeId !== 1))
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    const oneTimeCosts = this.program.costs
      .filter(c => c.frequencyTypeId === 1)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    const numSemesters = this.program.numberOfSemesters || this.semesters.length || 0;

    if (numSemesters > 0) {
      const grandTotal = (semCosts * numSemesters) + oneTimeCosts;
      if (grandTotal <= 0) return null;
      return grandTotal / numSemesters;
    }

    const fallbackTotal = semCosts > 0 ? semCosts : oneTimeCosts;
    return fallbackTotal > 0 ? fallbackTotal : null;
  }

  get semesterCostText(): string {
    const avgCost = this.averageSemesterCost;
    if (avgCost == null || avgCost <= 0) {
      return '-';
    }

    const formatted = avgCost.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(avgCost) ? 0 : 2,
      maximumFractionDigits: 2
    });

    return `${formatted} SOS`;
  }

  cancel(): void {
    this.router.navigate(['/academic-registration']);
  }

  async confirmRegistration(): Promise<void> {
    if (this.isSubmitting || !this.applicationId || !this.selectedSemesterNo) return;

    const semesterName = this.selectedSemester?.semesterName || `Semester ${this.selectedSemesterNo}`;
    const studentName = this.student?.fullName || 'the student';

    const confirmed = await this.confirmDialog.confirm({
      title: 'Confirm Student Registration',
      message: `Register ${studentName} for ${semesterName}? The API will validate eligibility and enroll all active courses configured for the selected semester.`,
      confirmText: 'Confirm Registration',
      cancelText: 'Cancel',
      variant: 'info'
    });

    if (!confirmed) return;

    this.isSubmitting = true;

    const request: RegisterStudentRequestModel = {
      applicationId: this.applicationId,
      semesterNo: this.selectedSemesterNo,
      registrationDate: this.registrationDate ? new Date(this.registrationDate) : new Date(),
      remarks: (this.remarks || '').trim()
    };

    this.academicRegistrationService.registerStudent(request).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.notification.success('Student registered successfully.');
          this.router.navigate(['/academic-registration']);
        } else {
          this.notification.warning(res.message || 'The registration request was not accepted.');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notification.handleBusinessError(err, 'Failed to register student.');
      }
    });
  }
}
