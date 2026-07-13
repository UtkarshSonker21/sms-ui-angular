import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { ProgramDocument } from '../../../core/models/university/programs/program-document.model';
import { StaffType } from '../../../core/enums/staff-type.enum';
import { AppRoutes } from '../../../core/constants/app-routes';


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
          } else {
            this.notification.warning(response.message);
          }
        },
        error: () => {
          this.notification.error('Failed to load program details.');
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

  // Cost items calculations matching Blazor logic
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

  get grandTotal(): number {
    const sem = this.semCosts;
    const numSem = this.program.numberOfSemesters || 0;
    const oneTime = this.oneTimeCosts;
    return (sem * numSem) + oneTime;
  }

  get costPerCredit(): number {
    const total = this.grandTotal;
    const credits = this.program.creditsRequired || 0;
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

  // Placeholder actions
  requestEditWindow(): void {}
  openRegistration(): void {}

  goBack(): void {
    this.router.navigate([AppRoutes.University.Faculties]);
  }
}
