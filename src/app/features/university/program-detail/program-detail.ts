import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { ProgramDocument } from '../../../core/models/university/programs/program-document.model';
import { ProgramRegistrationWindowModel } from '../../../core/models/university/programs/program-registration-window.model';
import { StaffType } from '../../../core/enums/staff-type.enum';
import { AppRoutes } from '../../../core/constants/app-routes';

export class ProgramEditWindowRequestModel {
  editFrom: string | null = null;
  editTo: string | null = null;
  comments: string = '';
}

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './program-detail.html',
  styleUrl: './program-detail.scss',
})
export class ProgramDetail implements OnInit {
  private notification = inject(NotificationService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private programService = inject(ProgramService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  programId = 0;
  program: ProgramRequest = new ProgramRequest();
  selectedTab = 'Overview';
  statusText = 'Not submitted';


  canAdd = true; // In Blazor: canAdd => PermissionService.CanInsert("programs") || true;

  ngOnInit(): void {
    this.programId = Number(this.route.snapshot.params['programId'] || this.route.snapshot.params['id'] || 0);
    this.getProgram();
  }

  getProgram(): void {
    if (this.programId > 0) {
      this.programService.getProgramById(this.programId).subscribe({
        next: (response) => {
          if (response.success && response.result) {
            this.program = response.result;
            this.updateStatusText();
            return;
          }
          this.notification.warning(response.message || 'Failed to load program details.');
        },
        error: (error) => {
          this.notification.handleBusinessError(
            error,
            'Failed to load program details.'
          );
        }
      });
    }
  }

  formatDate(dateVal: Date | string | undefined): string {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  updateStatusText(): void {
    const status = this.program.accreditationStatus;
    if (status === 2) {
      this.statusText = `Accredited ${this.formatDate(this.program.updatedDate)}`;
    } else if (status === 3) {
      this.statusText = `Rejected ${this.formatDate(this.program.updatedDate)}`;
    } else if (status === 1) {
      this.statusText = `Submitted ${this.formatDate(this.program.submittedDate)} · Pending for review`;
    } else {
      this.statusText = 'Not submitted';
    }
  }


  getTanzanianCombinationsList(): string[] {
    if (!this.program.allowedTanzanianCombinations) return [];
    return this.program.allowedTanzanianCombinations.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  getHighSchoolDivisionsList(): string[] {
    if (!this.program.allowedHighSchoolDivisions) return [];
    return this.program.allowedHighSchoolDivisions.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }


  getSortedCourses(): ProgramCourse[] {
    if (!this.program.courses) return [];
    return [...this.program.courses].sort((a, b) => {
      if (a.semesterNo !== b.semesterNo) {
        return a.semesterNo - b.semesterNo;
      }
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }

  getSortedDocuments(): ProgramDocument[] {
    if (!this.program.documents) return [];
    return [...this.program.documents].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }

    // Cost items calculations matching client prototype logic
  get semCosts(): number {
    if (!this.program.costs) return 0;
    return this.program.costs
      .filter(c => c.frequencyTypeId !== undefined && c.frequencyTypeId !== 1)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get oneTimeCosts(): number {
    if (!this.program.costs) return 0;
    return this.program.costs
      .filter(c => c.frequencyTypeId !== undefined && c.frequencyTypeId === 1)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get grandProgramCost(): number {
    return this.semCosts * (this.program.numberOfSemesters || 0);
  }

  get grandTotal(): number {
    return this.grandProgramCost + this.oneTimeCosts;
  }

  get totalCredits(): number {
    return this.totalCoursesCredits > 0 ? this.totalCoursesCredits : (this.program.creditsRequired || 0);
  }

  get costPerCredit(): number {
    const total = this.grandTotal;
    const credits = this.totalCredits;
    return credits > 0 ? total / credits : 0;
  }

  get avgPerSemester(): number {
    const total = this.grandTotal;
    const numSem = this.program.numberOfSemesters || 0;
    return numSem > 0 ? total / numSem : 0;
  }

  get totalCoursesCredits(): number {
    if (!this.program.courses) return 0;
    return this.program.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
  }

  // Edit Window Modal State
  showEditWindowModal = false;
  editWindowData: ProgramEditWindowRequestModel = new ProgramEditWindowRequestModel();
  isSubmittingEditWindow = false;

  // Registration Modal State
  showRegistrationModal = false;
  registrationSemesters: any[] = [];
  registrationData: ProgramRegistrationWindowModel = new ProgramRegistrationWindowModel();
  registrationDateFrom: string = '';
  registrationDateTo: string = '';
  isSemesterDropdownOpen = false;

  formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDefaultRegistrationDates(): { from: string; to: string } {
    const now = new Date();
    const fromStr = this.formatDateForInput(now);

    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let targetYear = year;
    let targetMonth = month + 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear++;
    }

    // Safely clamp day to target month's maximum days (handles leap years and month lengths)
    const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const targetDay = Math.min(day, maxDaysInTargetMonth);

    const toDate = new Date(targetYear, targetMonth, targetDay);
    const toStr = this.formatDateForInput(toDate);

    return { from: fromStr, to: toStr };
  }

  loadRegistrationWindowAndOpenModal(): void {
    this.programService.getProgramRegistrationWindowByProgramId(this.programId).subscribe({
      next: (regRes: any) => {
        const isSuccess = regRes?.success ?? regRes?.isSuccess;
        const existing = regRes?.result ?? regRes?.data;

        if (isSuccess && existing && (existing.id || existing.registrationFrom)) {
          this.registrationData = existing;
          this.registrationData.programId = this.programId;
          this.registrationDateFrom = this.formatDateForInput(existing.registrationFrom);
          this.registrationDateTo = this.formatDateForInput(existing.registrationTo);
        } else {
          this.registrationData = new ProgramRegistrationWindowModel();
          this.registrationData.programId = this.programId;
          this.registrationData.semesterNo = 0;
          const defaults = this.getDefaultRegistrationDates();
          this.registrationDateFrom = defaults.from;
          this.registrationDateTo = defaults.to;
        }

        this.isSemesterDropdownOpen = false;
        this.showRegistrationModal = true;
      },
      error: (error) => {
        this.registrationData = new ProgramRegistrationWindowModel();
        this.registrationData.programId = this.programId;
        this.registrationData.semesterNo = 0;
        const defaults = this.getDefaultRegistrationDates();
        this.registrationDateFrom = defaults.from;
        this.registrationDateTo = defaults.to;
        this.isSemesterDropdownOpen = false;
        this.showRegistrationModal = true;

        this.notification.handleBusinessError(
          error,
          'Failed to load registration window.'
        );
      }
    });
  }

  openRegistration(): void {
    if (this.programId <= 0) return;

    this.programService.getSemesterByProgramId(this.programId).subscribe({
      next: (res: any) => {
        let semesters: any[] = Array.isArray(res?.result) ? res.result : (Array.isArray(res?.data) ? res.data : []);

        const numSemesters = this.program.numberOfSemesters || 0;
        if (numSemesters > 0) {
          const semMap = new Map<number, any>();
          for (const s of semesters) {
            const num = s.semesterNo ?? s.SemesterNo;
            if (num) semMap.set(num, s);
          }

          const courseSemNames = new Map<number, string>();
          if (this.program.courses) {
            for (const c of this.program.courses) {
              if (c.semesterNo && c.semesterName) {
                courseSemNames.set(c.semesterNo, c.semesterName);
              }
            }
          }

          const fullList: any[] = [];
          for (let i = 1; i <= numSemesters; i++) {
            if (semMap.has(i)) {
              fullList.push(semMap.get(i));
            } else {
              fullList.push({
                programSemesterId: 0,
                semesterNo: i,
                semesterName: courseSemNames.get(i) || `Semester ${i}`
              });
            }
          }
          semesters = fullList;
        }

        this.registrationSemesters = semesters;
        this.loadRegistrationWindowAndOpenModal();
      },
      error: (error) => {
        const numSemesters = this.program.numberOfSemesters || 0;
        if (numSemesters > 0) {
          this.registrationSemesters = Array.from({ length: numSemesters }, (_, i) => ({
            programSemesterId: 0,
            semesterNo: i + 1,
            semesterName: `Semester ${i + 1}`
          }));
        } else {
          this.registrationSemesters = [];
        }

        this.loadRegistrationWindowAndOpenModal();

        this.notification.handleBusinessError(
          error,
          'Failed to load semesters.'
        );
      }
    });
  }

  closeRegistrationModal(): void {
    this.showRegistrationModal = false;
  }

  toggleSemesterDropdown(event: Event): void {
    event.stopPropagation();
    this.isSemesterDropdownOpen = !this.isSemesterDropdownOpen;
  }

  selectSemesterOption(semesterNo: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.registrationData) {
      this.registrationData.semesterNo = semesterNo;
    }
    this.isSemesterDropdownOpen = false;
  }

  clearSemesterSelection(event: Event): void {
    event.stopPropagation();
    if (this.registrationData) {
      this.registrationData.semesterNo = 0;
    }
  }

  getSelectedSemesterName(): string {
    if (!this.registrationData || !this.registrationData.semesterNo) return '';
    const sem = this.registrationSemesters.find(
      s => (s.semesterNo ?? s.SemesterNo) === this.registrationData!.semesterNo
    );
    if (sem) {
      return sem.semesterName || sem.SemesterName || (`Semester ${sem.semesterNo ?? sem.SemesterNo}`);
    }
    return `Semester ${this.registrationData.semesterNo}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.da-select')) {
      this.isSemesterDropdownOpen = false;
    }
  }

  saveRegistration(form: any): void {
    if (form && form.invalid) {
      this.notification.warning('Please fill out all required fields.');
      return;
    }

    if (!this.registrationData || !this.registrationData.semesterNo) {
      this.notification.warning('Semester is required.');
      return;
    }

    if (!this.registrationDateFrom || !this.registrationDateTo) {
      this.notification.warning('Please provide both registration dates.');
      return;
    }

    const from = new Date(this.registrationDateFrom);
    const to = new Date(this.registrationDateTo);

    if (from >= to) {
      this.notification.warning('Registration From must be earlier than Registration To.');
      return;
    }

    this.registrationData.registrationFrom = from;
    this.registrationData.registrationTo = to;
    this.registrationData.programId = this.programId;

    this.programService.saveProgramRegistrationWindow(this.registrationData).subscribe({
      next: (res: any) => {
        if (res.success || res.isSuccess) {
          this.notification.success('Registration window saved successfully.');
          this.showRegistrationModal = false;
          // Optionally refresh the data if needed

          return;
        }
        this.notification.error(res.message || 'Failed to save registration window.');
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to save registration window.'
        );
      }
    });
  }

  // Edit Window Actions
  requestEditWindow(): void {
    this.editWindowData = new ProgramEditWindowRequestModel();
    this.showEditWindowModal = true;
  }

  closeEditWindowModal(): void {
    this.showEditWindowModal = false;
    this.editWindowData = new ProgramEditWindowRequestModel();
    this.isSubmittingEditWindow = false;
  }

  submitEditWindowRequest(form: any): void {
    if (form && form.invalid) {
      this.notification.warning('Please fill out all required fields.');
      return;
    }

    if (!this.editWindowData.editFrom || !this.editWindowData.editTo) {
      this.notification.warning('Please provide both edit window dates.');
      return;
    }

    const from = new Date(this.editWindowData.editFrom);
    const to = new Date(this.editWindowData.editTo);

    if (from >= to) {
      this.notification.warning('Edit To must be later than Edit From.');
      return;
    }

    this.isSubmittingEditWindow = true;

    // Simulated submission (ready for future API integration)
    this.notification.success('Edit window request submitted successfully.');
    this.closeEditWindowModal();
    this.isSubmittingEditWindow = false;
  }

  goBack(): void {
    this.router.navigate([AppRoutes.University.Faculties]);
  }
}
