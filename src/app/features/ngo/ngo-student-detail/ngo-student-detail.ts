import { Component, HostListener, OnInit, inject } from '@angular/core';
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
import { SponsorshipAssignmentService } from '../../../core/services/ngo/sponsorship-assignment.service';
import { StudentCategoryService } from '../../../core/services/ngo/student-category.service';
import { StudentCategoryFilter } from '../../../core/models/ngo/student-category/student-category-filter.model';
import { StudentCategoryRequest } from '../../../core/models/ngo/student-category/student-category.request.model';
import {
  CreateSponsorshipAssignmentRequest,
  SponsorshipAssignment,
  SponsorshipAssignmentOption
} from '../../../core/models/ngo/sponsorshipMatrix/sponsorship-assignment.model';

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
  private sponsorshipAssignmentService = inject(SponsorshipAssignmentService);
  private studentCategoryService = inject(StudentCategoryService);

  studentStatus = StudentStatusEnum;

  studentId: number = 0;
  student: StudentProgramApplication | null = null;

  photoError: boolean = false;

  // Placeholder for when timeline API is provided
  documents: StudentProgramDocument[] = [];
  studentHistory: any[] = [];

  sponsorshipAssignments: SponsorshipAssignment[] = [];
  sponsorshipCategories: StudentCategoryRequest[] = [];
  sponsorshipAssignmentOptions: SponsorshipAssignmentOption[] = [];
  isLoadingSponsorshipAssignments = false;
  isLoadingSponsorshipCategories = false;
  isLoadingSponsorshipOptions = false;
  isSponsorshipAssignmentModalOpen = false;
  isSavingSponsorshipAssignment = false;
  editingSponsorshipAssignmentId: number | null = null;
  deactivatingAssignmentId: number | null = null;
  selectedSponsorshipCategoryId: number | null = null;
  isSponsorshipCategoryDropdownOpen = false;
  activeSponsorshipCategoryOptionIndex = 0;
  sponsorshipAssignmentRemarks = '';
  sponsorshipAssignmentsError = '';
  sponsorshipOptionsError = '';
  private sponsorshipOptionsRequestVersion = 0;
  
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
            this.loadSponsorshipAssignments(this.student.applicationId);
            this.loadSponsorshipCategories();
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

  private loadSponsorshipAssignments(applicationId: number): void {
    this.isLoadingSponsorshipAssignments = true;
    this.sponsorshipAssignmentsError = '';
    this.sponsorshipAssignmentService.getByApplication(applicationId).subscribe({
      next: (res) => {
        this.sponsorshipAssignments = res.success && res.result ? res.result : [];
        this.isLoadingSponsorshipAssignments = false;
        if (!res.success) {
          this.sponsorshipAssignmentsError = res.message || 'Sponsorship assignments could not be loaded.';
        }
      },
      error: (error) => {
        this.sponsorshipAssignments = [];
        this.sponsorshipAssignmentsError = 'Sponsorship assignments could not be loaded.';
        this.isLoadingSponsorshipAssignments = false;
        this.notification.handleBusinessError(error, this.sponsorshipAssignmentsError);
      }
    });
  }

  private loadSponsorshipCategories(): void {
    this.isLoadingSponsorshipCategories = true;
    const filter = new StudentCategoryFilter();
    filter.isActive = true;
    filter.pageSize = 1000;

    this.studentCategoryService.getStudentCategories(filter).subscribe({
      next: (res) => {
        this.sponsorshipCategories = res.success
          ? (res.result?.items || []).filter(category => category.isActive && category.studentCategoryId != null)
          : [];
        this.isLoadingSponsorshipCategories = false;
        if (!res.success) this.notification.error(res.message || 'Sponsorship categories could not be loaded.');
      },
      error: (error) => {
        this.sponsorshipCategories = [];
        this.isLoadingSponsorshipCategories = false;
        this.notification.handleBusinessError(error, 'Sponsorship categories could not be loaded.');
      }
    });
  }

  onSponsorshipCategoryChange(categoryId: number | null): void {
    this.selectedSponsorshipCategoryId = categoryId;
    this.sponsorshipAssignmentOptions = [];
    this.sponsorshipOptionsError = '';
    const requestVersion = ++this.sponsorshipOptionsRequestVersion;

    if (!categoryId || categoryId <= 0) {
      this.isLoadingSponsorshipOptions = false;
      return;
    }

    this.isLoadingSponsorshipOptions = true;
    this.sponsorshipAssignmentService.getOptionsByCategory(categoryId).subscribe({
      next: (res) => {
        if (requestVersion !== this.sponsorshipOptionsRequestVersion) return;
        this.sponsorshipAssignmentOptions = res.success && res.result ? res.result : [];
        this.isLoadingSponsorshipOptions = false;
        if (!res.success) {
          this.sponsorshipOptionsError = res.message || 'Sponsorship options could not be loaded.';
          this.notification.error(this.sponsorshipOptionsError);
        }
      },
      error: (error) => {
        if (requestVersion !== this.sponsorshipOptionsRequestVersion) return;
        this.sponsorshipAssignmentOptions = [];
        this.sponsorshipOptionsError = 'Sponsorship options could not be loaded.';
        this.isLoadingSponsorshipOptions = false;
        this.notification.handleBusinessError(error, this.sponsorshipOptionsError);
      }
    });
  }

  @HostListener('document:click')
  closeSponsorshipCategoryDropdown(): void {
    this.isSponsorshipCategoryDropdownOpen = false;
  }

  toggleSponsorshipCategoryDropdown(event: Event): void {
    event.stopPropagation();
    if (this.isSavingSponsorshipAssignment || this.isLoadingSponsorshipCategories || this.sponsorshipCategories.length === 0) return;

    this.isSponsorshipCategoryDropdownOpen = !this.isSponsorshipCategoryDropdownOpen;
    if (this.isSponsorshipCategoryDropdownOpen) {
      const selectedIndex = this.sponsorshipCategories.findIndex(
        category => category.studentCategoryId === this.selectedSponsorshipCategoryId
      );
      this.activeSponsorshipCategoryOptionIndex = selectedIndex >= 0 ? selectedIndex : 0;
    }
  }

  handleSponsorshipCategoryDropdownKeydown(event: KeyboardEvent): void {
    if (this.isSavingSponsorshipAssignment || this.isLoadingSponsorshipCategories || this.sponsorshipCategories.length === 0) return;

    const lastIndex = this.sponsorshipCategories.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isSponsorshipCategoryDropdownOpen) {
          this.isSponsorshipCategoryDropdownOpen = true;
          const selectedIndex = this.sponsorshipCategories.findIndex(
            category => category.studentCategoryId === this.selectedSponsorshipCategoryId
          );
          this.activeSponsorshipCategoryOptionIndex = selectedIndex >= 0 ? selectedIndex : 0;
        } else {
          this.activeSponsorshipCategoryOptionIndex = (this.activeSponsorshipCategoryOptionIndex + 1) % this.sponsorshipCategories.length;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isSponsorshipCategoryDropdownOpen) {
          this.isSponsorshipCategoryDropdownOpen = true;
          const selectedIndex = this.sponsorshipCategories.findIndex(
            category => category.studentCategoryId === this.selectedSponsorshipCategoryId
          );
          this.activeSponsorshipCategoryOptionIndex = selectedIndex >= 0 ? selectedIndex : lastIndex;
        } else {
          this.activeSponsorshipCategoryOptionIndex = this.activeSponsorshipCategoryOptionIndex <= 0
            ? lastIndex
            : this.activeSponsorshipCategoryOptionIndex - 1;
        }
        break;
      case 'Home':
        event.preventDefault();
        this.isSponsorshipCategoryDropdownOpen = true;
        this.activeSponsorshipCategoryOptionIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        this.isSponsorshipCategoryDropdownOpen = true;
        this.activeSponsorshipCategoryOptionIndex = lastIndex;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isSponsorshipCategoryDropdownOpen) {
          this.isSponsorshipCategoryDropdownOpen = true;
          const selectedIndex = this.sponsorshipCategories.findIndex(
            category => category.studentCategoryId === this.selectedSponsorshipCategoryId
          );
          this.activeSponsorshipCategoryOptionIndex = selectedIndex >= 0 ? selectedIndex : 0;
        } else {
          const activeCategory = this.sponsorshipCategories[this.activeSponsorshipCategoryOptionIndex];
          if (activeCategory) this.selectSponsorshipCategory(activeCategory.studentCategoryId);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.isSponsorshipCategoryDropdownOpen = false;
        break;
      case 'Tab':
        this.isSponsorshipCategoryDropdownOpen = false;
        break;
    }
  }

  selectSponsorshipCategory(categoryId: number): void {
    if (this.isSavingSponsorshipAssignment) return;
    this.selectedSponsorshipCategoryId = categoryId;
    this.isSponsorshipCategoryDropdownOpen = false;
    this.onSponsorshipCategoryChange(categoryId);
  }

  getSelectedSponsorshipCategoryName(): string {
    return this.sponsorshipCategories.find(
      category => category.studentCategoryId === this.selectedSponsorshipCategoryId
    )?.categoryName || '';
  }

  openSponsorshipAssignmentModal(): void {
    if (this.isLoadingSponsorshipCategories || this.sponsorshipCategories.length === 0) return;
    this.editingSponsorshipAssignmentId = null;
    this.selectedSponsorshipCategoryId = null;
    this.isSponsorshipCategoryDropdownOpen = false;
    this.sponsorshipAssignmentOptions = [];
    this.sponsorshipOptionsError = '';
    this.sponsorshipAssignmentRemarks = '';
    this.isSponsorshipAssignmentModalOpen = true;
  }

  closeSponsorshipAssignmentModal(): void {
    if (this.isSavingSponsorshipAssignment) return;
    ++this.sponsorshipOptionsRequestVersion;
    this.isSponsorshipAssignmentModalOpen = false;
    this.editingSponsorshipAssignmentId = null;
    this.selectedSponsorshipCategoryId = null;
    this.isSponsorshipCategoryDropdownOpen = false;
    this.sponsorshipAssignmentOptions = [];
    this.sponsorshipAssignmentRemarks = '';
  }

  saveSponsorshipAssignment(): void {
    const applicationId = this.student?.applicationId;
    if (!applicationId || !this.selectedSponsorshipCategoryId || this.isLoadingSponsorshipOptions
      || this.sponsorshipOptionsError || this.sponsorshipAssignmentOptions.length === 0
      || this.isSavingSponsorshipAssignment) return;

    const request: CreateSponsorshipAssignmentRequest = {
      studentCategoryId: this.selectedSponsorshipCategoryId,
      remarks: this.sponsorshipAssignmentRemarks.trim() || null
    };

    this.isSavingSponsorshipAssignment = true;
    const saveRequest = this.editingSponsorshipAssignmentId
      ? this.sponsorshipAssignmentService.update(this.editingSponsorshipAssignmentId, request)
      : this.sponsorshipAssignmentService.create(applicationId, request);

    saveRequest.subscribe({
      next: (res) => {
        this.isSavingSponsorshipAssignment = false;
        if (res.success) {
          this.isSponsorshipAssignmentModalOpen = false;
          this.editingSponsorshipAssignmentId = null;
          this.notification.success(res.message || 'DA Pool sponsorship assignment saved successfully.');
          this.loadSponsorshipAssignments(applicationId);
        } else {
          this.notification.error(res.message || 'Failed to save the sponsorship assignment.');
        }
      },
      error: (error) => {
        this.isSavingSponsorshipAssignment = false;
        this.notification.handleBusinessError(error, 'Failed to save the sponsorship assignment.');
      }
    });
  }

  editSponsorshipAssignment(assignment: SponsorshipAssignment): void {
    if (!assignment.isActive || this.isLoadingSponsorshipCategories || this.isSavingSponsorshipAssignment) return;
    if (!this.sponsorshipCategories.some(category => category.studentCategoryId === assignment.studentCategoryId)) {
      this.notification.error('This assignment category is no longer active and cannot be selected for editing.');
      return;
    }

    this.editingSponsorshipAssignmentId = assignment.assignmentId;
    this.selectedSponsorshipCategoryId = assignment.studentCategoryId;
    this.sponsorshipAssignmentRemarks = assignment.remarks || '';
    this.sponsorshipOptionsError = '';
    this.isSponsorshipAssignmentModalOpen = true;
    this.onSponsorshipCategoryChange(assignment.studentCategoryId);
  }

  getSponsorshipFrequencyLabel(frequencyType: number): string {
    if (frequencyType === 1) return 'Per semester';
    if (frequencyType === 2) return 'One-time';
    return `Frequency ${frequencyType}`;
  }

  deactivateSponsorshipAssignment(assignment: SponsorshipAssignment): void {
    if (!assignment.isActive || this.deactivatingAssignmentId != null) return;

    this.confirmDialog.confirm({
      title: 'Deactivate sponsorship assignment?',
      message: `Deactivate ${assignment.sponsorshipName} — ${assignment.categoryName}? The assignment record will be retained in history.`,
      confirmText: 'Deactivate',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (!confirmed) return;

      this.deactivatingAssignmentId = assignment.assignmentId;
      this.sponsorshipAssignmentService.deactivate(assignment.assignmentId).subscribe({
        next: (res) => {
          this.deactivatingAssignmentId = null;
          if (res.success) {
            this.notification.success(res.message || 'Sponsorship assignment deactivated.');
            if (this.student?.applicationId) {
              this.loadSponsorshipAssignments(this.student.applicationId);
            }
          } else {
            this.notification.error(res.message || 'Failed to deactivate the sponsorship assignment.');
          }
        },
        error: (error) => {
          this.deactivatingAssignmentId = null;
          this.notification.handleBusinessError(error, 'Failed to deactivate the sponsorship assignment.');
        }
      });
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
