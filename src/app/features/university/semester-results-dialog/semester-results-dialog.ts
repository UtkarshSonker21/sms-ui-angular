import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { AcademicHistoryRegistrationModel } from '../../../core/models/university/academic-registration/academic-history.model';
import { ProgramSemester } from '../../../core/models/university/programs/program-semester.model';

@Component({
  selector: 'app-semester-results-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './semester-results-dialog.html',
  styleUrls: ['./semester-results-dialog.scss']
})
export class SemesterResultsDialog implements OnChanges {
  @Input() isOpen = false;
  @Input() student: StudentProgramApplication | null = null;
  @Input() registration: AcademicHistoryRegistrationModel | null = null;
  @Input() courses: any[] = [];
  @Input() nextSemesterSchedule: ProgramSemester | null = null;
  @Input() currentGpa: number | null = null;
  @Input() initialNote = '';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ gpa: number | null, note: string, outcomes: Map<string, 'pass' | 'fail'> }>();

  modalGpa: number | null = null;
  modalNote = '';
  modalCourseOutcomes = new Map<string, 'pass' | 'fail'>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initFormState();
    }
  }

  initFormState(): void {
    this.modalGpa = this.currentGpa ?? this.registration?.semesterResult?.semesterGpa ?? null;
    this.modalNote = this.initialNote ?? '';
    this.modalCourseOutcomes.clear();

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
  }

  markAllAsPass(): void {
    const courseList = this.courses || [];
    for (const c of courseList) {
      this.modalCourseOutcomes.set(c.courseCode, 'pass');
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    this.save.emit({
      gpa: this.modalGpa,
      note: this.modalNote,
      outcomes: this.modalCourseOutcomes
    });
  }
}
