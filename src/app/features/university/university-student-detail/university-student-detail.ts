import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { NotificationService } from '../../../core/services/common/notification.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { StudentProgramDocument } from '../../../core/models/school/student-program-application/student-program-document.model';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';


@Component({
  selector: 'app-university-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './university-student-detail.html',
  styleUrls: ['./university-student-detail.scss', '../university-students/university-students.scss'],
})
export class UniversityStudentDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private studentProgramService = inject(StudentProgramService);
  private studentStatusService = inject(StudentStatusService);
  private confirmDialog = inject(ConfirmDialogService);

  studentStatus = StudentStatusEnum;

  studentId: number = 0;
  student: StudentProgramApplication | null = null;

  photoError: boolean = false;

  // Placeholder for when timeline API is provided
  documents: StudentProgramDocument[] = [];
  studentHistory: any[] = [];

  // Section toggle state (mirroring coordinator student edit)
  activeSection: number = 1;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.studentId = +idParam;
      this.loadStudentDetails();
    }
  }

  loadStudentDetails(): void {

    this.studentProgramService.getById(this.studentId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.student = res.result;
          this.photoError = false;

          // Fallback simple timeline for now using actionDate
          if (this.student.actionDate) {
            this.studentHistory = [{
              title: 'Status Updated',
              description: `Status changed to ${this.student.applicationStatusName}`,
              createdDate: this.student.actionDate
            }];
          }

          if (this.student.applicationId) {
            this.loadDocuments(this.student.applicationId);
          }

          return;
        }
        this.notification.error(
          res.message || 'Failed to load student details.'
        );
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load student details.'
        );
      }
    });
  }

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  loadDocuments(applicationId: number): void {
    this.studentProgramService.getDocuments(applicationId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.documents = res.result;
          return;
        }
        this.documents = [];
        if (res.message) {
          this.notification.error(res.message);
        }
      },
      error: (error) => {
        this.documents = [];

        this.notification.handleBusinessError(
          error,
          'Failed to load submitted documents.'
        );
      }
    });
  }

  handlePhotoError(): void {
    this.photoError = true;
  }

  goBack(): void {
    this.router.navigate(['/university-students']);
  }

  toggleSection(section: number): void {
    this.activeSection = this.activeSection === section ? 0 : section;
  }

  // Workflows - pending implementation
  approve(): void {
    this.notification.info('Approve workflow pending implementation.');
  }

  reject(): void {
    this.notification.info('Reject workflow pending implementation.');
  }

  register(): void {
    this.notification.info('Register workflow pending implementation.');
  }

  graduate(): void {
    this.notification.info('Graduate workflow pending implementation.');
  }

  previewDocument(documentTypeId: number): void {
    const doc = this.documents.find(d => d.documentTypeId === documentTypeId);
    if (doc && doc.storagePath) {
      const previewUrl = HelperMethods.getFileUrl(doc.storagePath);
      window.open(previewUrl, '_blank');
    } else {
      this.notification.info('Document preview is not available.');
    }
  }

  getUploadedDocStatus(documentTypeId: number): string {
    const doc = this.documents.find(d => d.documentTypeId === documentTypeId);
    return (doc && doc.storagePath && doc.storagePath.length > 0) ? 'Uploaded' : 'Pending Upload';
  }

  getDiscussionCount(documentTypeId: number): number {
    const doc = this.documents.find(d => d.documentTypeId === documentTypeId);
    let count = 0;
    if (doc?.reviewerRemark?.trim().length) count++;
    if (doc?.universityRemark?.trim().length) count++;
    return count;
  }

  isDiscussionModalOpen = false;
  currentDiscussionRemark = '';
  universityDiscussionRemark = '';
  currentDiscussionDocTypeId: number | null = null;

  openDiscussionModal(docTypeId: number): void {
    this.currentDiscussionDocTypeId = docTypeId;
    const existingDoc = this.documents.find(d => d.documentTypeId === docTypeId);
    this.currentDiscussionRemark = existingDoc?.reviewerRemark || '';
    this.universityDiscussionRemark = existingDoc?.universityRemark || '';
    this.isDiscussionModalOpen = true;
  }

  closeDiscussionModal(): void {
    this.isDiscussionModalOpen = false;
    this.currentDiscussionDocTypeId = null;
    this.currentDiscussionRemark = '';
    this.universityDiscussionRemark = '';
  }

  saveUniversityRemark(): void {
    if (!this.currentDiscussionDocTypeId) return;

    let existingDoc = this.documents.find(d => d.documentTypeId === this.currentDiscussionDocTypeId);
    if (existingDoc) {
      existingDoc.universityRemark = this.universityDiscussionRemark;
    } else {
      this.documents.push({
        documentTypeId: this.currentDiscussionDocTypeId,
        universityRemark: this.universityDiscussionRemark
      } as any);
    }

    this.notification.success('University remark saved successfully.');
    this.closeDiscussionModal();
  }

  // --- Status Badge Helper ---
  getStatusBadgeClass(student: StudentProgramApplication): string {
    return this.studentStatusService.getBadgeClass(
      student.applicationStatusId ?? StudentStatusEnum.Draft
    );
  }

  getUploadedDocumentsCount(): number {
    return this.documents.filter(d => this.getUploadedDocStatus(d.documentTypeId) === 'Uploaded').length;
  }

  private refreshApplicationWorkflow(): void {
    this.activeSection = 3;
    this.loadStudentDetails();
  }

  rejectApplication(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Reject Application',
      message: 'Are you sure you want to reject this application?\nThis action will change the application status to "Acceptance Rejected".',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      variant: 'danger'
    }).then(confirmed => {

      if (confirmed) {

        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.AcceptanceRejected,
          remarks: null as any
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Application rejected successfully.');
              this.refreshApplicationWorkflow();
              return;
            }
            this.notification.error(
              res.message || 'Failed to reject application.'
            );
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to reject application.'
            );
          }
        });
      }

    });
  }

  acceptApplication(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Accept Application',
      message: 'Are you sure you want to accept this application?',
      confirmText: 'Accept',
      cancelText: 'Cancel',
      variant: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.Accepted,
          remarks: null as any
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Application accepted successfully.');
              this.refreshApplicationWorkflow();
              return;
            }
            this.notification.error(
              res.message || 'Failed to accept application.'
            );
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to accept application.'
            );
          }
        });
      }
    });
  }

  submitForAwardingReview(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Submit for Awarding Review',
      message: 'Are you sure you want to submit this application for Awarding Review?\n\nOnce submitted, the application status will change to "Awarding In Process" and the university can begin the final awarding review.',
      confirmText: 'Submit',
      cancelText: 'Cancel',
      variant: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.AwardingInProcess,
          remarks: null as any
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Application submitted for awarding review successfully.');
              this.refreshApplicationWorkflow();
              return;
            }
            this.notification.error(res.message || 'Failed to submit application.');
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to submit application.'
            );
          }
        });
      }
    });
  }

  awardApplication(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Award Application',
      message: 'Are you sure you want to award this application?',
      confirmText: 'Award',
      cancelText: 'Cancel',
      variant: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.Awarded,
          remarks: null as any
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Application awarded successfully.');
              this.refreshApplicationWorkflow();
              return;
            }
            this.notification.error(res.message || 'Failed to award application.');
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to award application.'
            );
          }
        });
      }
    });
  }

  rejectAwardingApplication(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Reject Awarding',
      message: 'Are you sure you want to reject this application?\nThis action will change the application status to "Awarding Rejected".',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.AwardingRejected,
          remarks: null as any
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Awarding review rejected successfully.');
              this.refreshApplicationWorkflow();
              return;
            } 
            this.notification.error(res.message || 'Failed to reject awarding review.'); 
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to reject awarding review.'
            );
          }
        });
      }
    });
  }


}
