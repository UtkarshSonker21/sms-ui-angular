import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { AcademicHistoryRegistrationModel } from '../../../core/models/university/academic-registration/academic-history.model';
import { ProgramSemester } from '../../../core/models/university/programs/program-semester.model';
import { SaveCourseResultRequestModel } from '../../../core/models/university/academic-registration/academic-results.model';

export interface SemesterResultsSaveEvent {
  academicRegistrationId: number;
  semesterNo: number;
  expectedUpdatedOn: string | null;
  gpa: number | null;
  note: string;
  courseResults: SaveCourseResultRequestModel[];
  outcomes: Map<string, 'pass' | 'fail'>;
  hasCoreFailed: boolean;
}

@Component({
  selector: 'app-semester-results-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './semester-results-dialog.html',
  styleUrls: ['./semester-results-dialog.scss']
})
export class SemesterResultsDialog implements OnChanges {
  @Input() isOpen = false;
  @Input() isSaving = false;
  @Input() student: StudentProgramApplication | null = null;
  @Input() registration: AcademicHistoryRegistrationModel | null = null;
  @Input() courses: any[] = [];
  @Input() nextSemesterSchedule: ProgramSemester | null = null;
  @Input() currentGpa: number | null = null;
  @Input() initialNote = '';
  @Input() expectedUpdatedOn: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<SemesterResultsSaveEvent>();

  modalGpa: number | null = null;
  modalNote = '';
  modalExpectedUpdatedOn: string | null = null;
  modalCourseOutcomes = new Map<string, 'pass' | 'fail'>();
  validationError = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initFormState();
    }
  }

  initFormState(): void {
    this.modalGpa = this.currentGpa ?? this.registration?.semesterResult?.semesterGpa ?? null;
    this.modalNote = this.initialNote ?? '';
    this.modalExpectedUpdatedOn = this.expectedUpdatedOn ?? this.registration?.semesterResult?.updatedOn ?? null;
    this.modalCourseOutcomes.clear();
    this.validationError = '';

    const courseList = this.courses || [];
    for (const c of courseList) {
      if (c.isPassed === true) {
        this.modalCourseOutcomes.set(c.courseCode, 'pass');
      } else if (c.isPassed === false) {
        this.modalCourseOutcomes.set(c.courseCode, 'fail');
      }
    }
  }

  get semesterNo(): number {
    return this.registration?.semesterNo || 1;
  }

  get semesterName(): string {
    return this.registration?.semesterName || `Semester ${this.semesterNo}`;
  }

  get datesRange(): string {
    if (this.registration?.startDate && this.registration?.endDate) {
      const d1 = new Date(this.registration.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const d2 = new Date(this.registration.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${d1} → ${d2}`;
    }
    return '';
  }

  get termName(): string {
    const reg = this.registration;
    return `${reg?.termName || 'Term'}${reg?.academicYearName ? ' ' + reg.academicYearName : ''}`;
  }

  get nextSemesterNo(): number {
    return this.semesterNo + 1;
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
    const courseList = this.courses || [];
    const failedCore = courseList.filter(c => c.courseType === 1 && this.modalCourseOutcomes.get(c.courseCode) === 'fail');
    return failedCore.map(c => c.courseName).join(', ');
  }

  get hasCoreFailed(): boolean {
    return !!this.failedCoreCoursesList;
  }

  get saveButtonLabel(): string {
    if (this.hasCoreFailed) {
      return 'Send to Kafaat Committee';
    }
    return `Save & move to ${this.nextSemesterName}`;
  }

  setCourseResult(courseCode: string, result: 'pass' | 'fail'): void {
    this.modalCourseOutcomes.set(courseCode, result);
    this.validationError = '';
  }

  markAllAsPass(): void {
    const courseList = this.courses || [];
    for (const c of courseList) {
      this.modalCourseOutcomes.set(c.courseCode, 'pass');
    }
    this.validationError = '';
  }

  onClose(): void {
    if (this.isSaving) return;
    this.close.emit();
  }

  onSave(): void {
    if (this.isSaving) return;
    this.validationError = '';

    const courseList = this.courses || [];
    if (courseList.length === 0) {
      this.validationError = 'There are no enrolled courses for this semester.';
      return;
    }

    const unassigned = courseList.find(c => !this.modalCourseOutcomes.has(c.courseCode));
    if (unassigned) {
      this.validationError = 'Select Pass or Fail for every course before saving.';
      return;
    }

    if (this.modalGpa !== null && this.modalGpa !== undefined && (isNaN(this.modalGpa) || this.modalGpa < 0 || this.modalGpa > 4 || Math.abs(this.modalGpa * 100 - Math.round(this.modalGpa * 100)) > 0.0000001)) {
      this.validationError = 'Semester GPA must be between 0.00 and 4.00 with at most two decimal places.';
      return;
    }

    if ((this.modalNote?.length ?? 0) > 1000) {
      this.validationError = 'The note cannot exceed 1,000 characters.';
      return;
    }

    const courseResults: SaveCourseResultRequestModel[] = courseList.map(c => ({
      studentCourseEnrollmentId: c.studentCourseEnrollmentId,
      isPassed: this.modalCourseOutcomes.get(c.courseCode) === 'pass'
    }));

    const regId = this.registration?.academicRegistrationId || 0;

    this.save.emit({
      academicRegistrationId: regId,
      semesterNo: this.semesterNo,
      expectedUpdatedOn: this.modalExpectedUpdatedOn,
      gpa: this.modalGpa !== null && this.modalGpa !== undefined && !isNaN(this.modalGpa) ? Number(this.modalGpa) : null,
      note: (this.modalNote || '').trim(),
      courseResults,
      outcomes: this.modalCourseOutcomes,
      hasCoreFailed: this.hasCoreFailed
    });
  }
}
