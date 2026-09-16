import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentStatusService } from '../../../core/services/common/student-status.service';

@Component({
  selector: 'app-academic-record',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './academic-record.html',
  styleUrls: ['./academic-record.scss', '../university-students/university-students.scss']
})
export class AcademicRecord implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private studentProgramService = inject(StudentProgramService);
  private studentStatusService = inject(StudentStatusService);

  studentId: number = 0;
  student: StudentProgramApplication | null = null;
  isLoading: boolean = true;
  photoError: boolean = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.studentId = +idParam;
      this.loadStudentDetails();
    }
  }

  loadStudentDetails(): void {
    this.isLoading = true;
    this.studentProgramService.getById(this.studentId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.result) {
          this.student = res.result;
          this.photoError = false;
          
          // TODO: Implement Academic Record API integration.
          // Replace N/A fallback values with API-backed academic record data
          // once the backend endpoint is available.
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

  getBadgeClass(): string {
    if (!this.student) return '';
    return this.studentStatusService.getBadgeClass(this.student.applicationStatusId);
  }

  getStatusName(): string {
    if (!this.student) return '';
    return this.studentStatusService.getName(this.student.applicationStatusId);
  }

  goBack(): void {
    if(this.studentId) {
        this.router.navigate(['/registered-student', this.studentId]);
    } else {
        this.router.navigate(['/university-students']);
    }
  }

  getInitials(): string {
    if (!this.student) return '?';
    return (this.student.firstName ? this.student.firstName.charAt(0).toUpperCase() : '') +
           (this.student.lastName ? this.student.lastName.charAt(0).toUpperCase() : '');
  }

  downloadPdf(): void {
    // TODO: Implement PDF download when the academic record PDF API is available.
  }

  submitSemesterResults(): void {
    // TODO: Implement semester result submission when the API is available.
  }
}
