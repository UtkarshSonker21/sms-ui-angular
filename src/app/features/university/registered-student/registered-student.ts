import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registered-student',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registered-student.html',
  styleUrls: ['./registered-student.scss', '../university-students/university-students.scss']
})
export class RegisteredStudent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private studentProgramService = inject(StudentProgramService);
  private studentStatusService = inject(StudentStatusService);

  studentStatus = StudentStatusEnum;
  applicationId: number = 0;
  student: StudentProgramApplication | null = null;
  photoError: boolean = false;
  isLoading: boolean = true;
  apiGaps = true;

  // Status Update Modal
  showStatusModal: boolean = false;
  selectedStatusAction: string = 'Graduated';
  statusNotes: string = '';

  ngOnInit(): void {
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
        this.isLoading = false;
        if (res.success && res.result) {
          this.student = res.result;
          this.photoError = false;

          // Double check they are registered
          if (this.student.applicationStatusId !== StudentStatusEnum.Registered) {
            this.notification.warning('Student is not in Registered status. Redirecting to application profile.');
            this.router.navigate(['/university-student-details', this.student.applicationId]);
          }

        } else {
          this.notification.error(res.message || 'Failed to load student details.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notification.handleBusinessError(error, 'Failed to load student details.');
      }
    });
  }

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  handlePhotoError(): void {
    this.photoError = true;
  }

  goBack(): void {
    this.router.navigate(['/university-students']);
  }

  viewUniversityStudentDetails(): void {
    if (this.student) {
      this.router.navigate(['/university-student-details', this.student.applicationId]);
    }
  }

  getBadgeClass(): string {
    if (!this.student) return '';
    return this.studentStatusService.getBadgeClass(this.student.applicationStatusId);
  }

  getStatusName(): string {
    if (!this.student) return '';
    return this.studentStatusService.getName(this.student.applicationStatusId);
  }

  // Formatting helpers
  getInitials(): string {
    if (!this.student) return '?';
    return (this.student.firstName ? this.student.firstName.charAt(0).toUpperCase() : '') +
           (this.student.lastName ? this.student.lastName.charAt(0).toUpperCase() : '');
  }

  openStatusModal(): void {
    this.showStatusModal = true;
    this.selectedStatusAction = 'Graduated';
    this.statusNotes = '';
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
  }

  selectStatus(status: string): void {
    this.selectedStatusAction = status;
  }

  saveStatus(): void {
    // TODO: Implement backend status update API.
    // TODO: Load valid status transitions from the backend.
    // TODO: Persist the selected status and notes.
    // TODO: Refresh student details after successful status update.
    // TODO: Add success/error notification handling.
    // TODO: Handle API validation and status-transition errors.
    
    // Simulate successful save and close modal for now
    this.closeStatusModal();
  }

  viewAcademicRecord(): void {
    if (this.applicationId) {
      this.router.navigate(['/registered-student', this.applicationId, 'academic-record']);
    }
  }
}


