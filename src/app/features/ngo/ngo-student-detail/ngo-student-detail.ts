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
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';

@Component({
  selector: 'app-ngo-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ngo-student-detail.html',
  styleUrls: ['./ngo-student-detail.scss', '../ngo-students/ngo-students.scss'],
})
export class NgoStudentDetail implements OnInit {
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
        } else {
          this.notification.error(res.message || 'Failed to load student details.');
        }

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
    // Reusing the school module service for document fetching since it's the exact same logic.
    this.studentProgramService.getDocuments(applicationId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.documents = res.result;
        } else {
          this.documents = [];
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
    this.router.navigate(['/ngo-students']);
  }

  toggleSection(section: number): void {
    this.activeSection = this.activeSection === section ? 0 : section;
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

  submitForSponsorshipReview(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Submit for Sponsorship Review?',
      message: 'The application will be forwarded for sponsorship review.\n\nDo you want to continue?',
      confirmText: 'Submit',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.SponsoringInProcess,
          remarks: ''
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Application submitted for sponsorship review.');
              this.refreshApplicationWorkflow();
            } else {
              this.notification.error(res.message || 'Failed to submit application.');
            }
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to submit for sponsorship review.'
            );
          }
        });
      }
    });
  }

  rejectSponsorship(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Reject Sponsorship',
      message: 'Are you sure you want to reject this sponsorship application?',
      confirmText: 'Yes, Reject',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.SponsoringRejected,
          remarks: ''
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Sponsorship application rejected.');
              this.refreshApplicationWorkflow();
            } else {
              this.notification.error(res.message || 'Failed to reject application.');
            }
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to reject sponsorship.'
            );
          }
        });
      }
    });
  }

  sponsor(): void {
    if (!this.student) return;

    this.confirmDialog.confirm({
      title: 'Approve Sponsorship',
      message: 'Are you sure you want to approve this sponsorship application?',
      confirmText: 'Yes, Approve',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(this.studentId, {
          applicationStatusId: StudentStatusEnum.Sponsored,
          remarks: ''
        }).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Sponsorship application approved.');
              this.refreshApplicationWorkflow();
            } else {
              this.notification.error(res.message || 'Failed to approve application.');
            }
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to approve sponsorship.'
            );
          }
        });
      }
    });
  }

  // ==========================================
  // TODO: Temporary UI placeholders.
  // Replace with API properties later.
  // ==========================================
  applicationNumber = '2024-0847';
  submittedDate: Date | null = new Date('2024-09-01');
  minimumPercentage = '85%';
  programDuration = '6 years';

  motherName = '';
  dateOfBirth: Date | null = null;
  nationality = '';
  countryOfResidence = '';
  gender = '';
  religion = '';
  directAidOrphan = false;
  orphanNumber = '';

  phoneNumber = '';
  email = '';
  city = '';
  village = '';
  block = '';
  street = '';
}
