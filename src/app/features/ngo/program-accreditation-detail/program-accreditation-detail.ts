import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { AppRoutes } from '../../../core/constants/app-routes';
import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { ProgramAccreditationModel } from '../../../core/models/ngo/accreditation/program-accreditation.model';
import { AccreditationService } from '../../../core/services/ngo/accreditation.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-program-accreditation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './program-accreditation-detail.html',
  styleUrl: './program-accreditation-detail.scss',
})
export class ProgramAccreditationDetail implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isStatusDropdownOpen = false;
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private programService = inject(ProgramService);
  private accreditationService = inject(AccreditationService);
  private notification = inject(NotificationService);

  program = new ProgramRequest();
  selectedStatus = 1; // 1 = Pending, 2 = Accredited (Accepted), 3 = Rejected
  comment = '';
  isStatusDropdownOpen = false;

  ngOnInit(): void {
    const programId = Number(this.route.snapshot.params['programId']);
    if (programId) {
      this.loadProgram(programId);
    }
  }

  loadProgram(id: number): void {
    this.programService.getProgramById(id).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.program = response.result;
          this.selectedStatus = this.program.accreditationStatus || 1;
          this.comment = this.program.committeeComment || '';
        } else {
          this.notification.error('Failed to load program details.');
          this.router.navigate(['programs']);
        }
      },
      error: () => {
        this.notification.error('Failed to retrieve program details.');
        this.router.navigate(['programs']);
      }
    });
  }

  getTotalAnnualCost(): number {
    if (!this.program.costs) return 0;
    return this.program.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
  }

  getSemesterNumbers(): number[] {
    if (!this.program.courses) return [];
    const sems = this.program.courses.map(c => c.semesterNo);
    return Array.from(new Set(sems)).sort((a, b) => a - b);
  }

  getCoursesForSemester(semNo: number): ProgramCourse[] {
    if (!this.program.courses) return [];
    return this.program.courses.filter(c => c.semesterNo === semNo);
  }

  getSemesterCredits(semNo: number): number {
    return this.getCoursesForSemester(semNo).reduce((sum, c) => sum + (c.credits || 0), 0);
  }


  getStatusLabel(status?: number): string {
    switch (status) {
      case AccreditationStatus.Pending:
        return 'Pending';

      case AccreditationStatus.Accredited:
        return 'Accepted';

      case AccreditationStatus.Rejected:
        return 'Rejected';

      default:
        return 'Pending';
    }
  }

  getBadgeClass(status?: number): string {
    switch (status) {
      case 1: return 'badge-pending';
      case 2: return 'badge-accredited';
      case 3: return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  getAvgPerSemester(): number {
    const sems = this.program.numberOfSemesters || 1;
    return this.getTotalAnnualCost() / sems;
  }

  selectStatus(status: number): void {
    this.selectedStatus = status;
    this.isStatusDropdownOpen = false;
  }

  updateDecision(): void {

    const payload = new ProgramAccreditationModel();

    payload.programId = this.program.programId!;
    payload.accreditationStatus = this.selectedStatus;
    payload.committeeComment = this.comment;
    payload.updatedBy = 0; // backend/current-user handling if applicable

    this.accreditationService.accreditProgram(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Accreditation decision updated successfully.');
          this.loadProgram(this.program.programId!);
        } else {
          this.notification.error(response.message || 'Failed to update decision.');
        }
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error?.error?.message ||
          error?.error?.Message ||
          error?.message ||
          'Failed to update accreditation decision.';

        this.notification.error(message);
      }
    });
  }

  backToList(): void {
    this.router.navigate([AppRoutes.Ngo.ProgramAccreditation]);
  }

  MathCeil(val: number): number {
    return Math.ceil(val);
  }

}
