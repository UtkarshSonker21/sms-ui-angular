import { Component, OnInit, inject, HostListener } from '@angular/core';
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
import { StudentHistory } from '../../../core/models/school/student-program-application/student-history.model';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { MasterCurrencyService } from '../../../core/services/superadmin/master-currency.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramCost } from '../../../core/models/university/programs/program-cost.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { MasterCurrencyFilter } from '../../../core/models/super-admin/master-currency/master-currency-filter.model';
import { MasterCurrencyRequest } from '../../../core/models/super-admin/master-currency/master-currency-request.model';


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
  private programService = inject(ProgramService);
  private masterCurrencyService = inject(MasterCurrencyService);

  // Program Load & Cost state
  program: ProgramRequest | null = null;
  isProgramLoading = false;
  programCurrency: string = 'SOS';
  currencies: MasterCurrencyRequest[] = [];
  isFullCostModalOpen = false;

  studentStatus = StudentStatusEnum;

  studentId: number = 0;
  student: StudentProgramApplication | null = null;

  photoError: boolean = false;

  // Status dropdown state
  selectedNewStatusId: number | null = null;
  statusNotes: string = '';
  isStatusDropdownOpen = false;
  isUpdatingStatus = false;
  activeOptionIndex = -1;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event?: MouseEvent): void {
    if (event) {
      const target = event.target as HTMLElement;
      if (target && target.closest('.da-select')) {
        return;
      }
    }
    this.isStatusDropdownOpen = false;
  }

  get isSponsored(): boolean {
    return this.student?.applicationStatusId === StudentStatusEnum.Sponsored;
  }

  get committeeDecisionDate(): Date | null {
    if (!this.student || this.student.applicationStatusId !== StudentStatusEnum.Sponsored) {
      return null;
    }

    if (this.studentHistory && this.studentHistory.length > 0) {
      const sponsoredItem = this.studentHistory.find(h => {
        const title = (h.title || '').toLowerCase();
        const desc = (h.description || '').toLowerCase();
        return title.includes('sponsored') || desc.includes('sponsored') || h.historyType === StudentStatusEnum.Sponsored;
      });
      if (sponsoredItem?.createdDate) {
        return new Date(sponsoredItem.createdDate);
      }
    }

    if (this.student.actionDate) {
      return new Date(this.student.actionDate);
    }

    return null;
  }

  get isAwarded(): boolean {
    return this.student?.applicationStatusId === StudentStatusEnum.Awarded;
  }

  get committeeSubmissionDate(): Date | null {
    if (!this.student || this.student.applicationStatusId !== StudentStatusEnum.Awarded) {
      return null;
    }

    if (this.studentHistory && this.studentHistory.length > 0) {
      const awardedItem = this.studentHistory.find(h => {
        const title = (h.title || '').toLowerCase();
        const desc = (h.description || '').toLowerCase();
        return title.includes('awarded') || desc.includes('awarded') || h.historyType === StudentStatusEnum.Awarded;
      });
      if (awardedItem?.createdDate) {
        return new Date(awardedItem.createdDate);
      }
    }

    if (this.student.actionDate) {
      return new Date(this.student.actionDate);
    }

    return null;
  }

  // Allowed transitions per status for University role (aligned with backend CanChangeStatus)
  readonly statusTransitions: { [key: number]: number[] } = {
    [StudentStatusEnum.AcceptanceInProcess]: [
      StudentStatusEnum.Accepted,
      StudentStatusEnum.AcceptanceRejected
    ],
    [StudentStatusEnum.Accepted]: [
      StudentStatusEnum.AwardingInProcess,
      StudentStatusEnum.Awarded,
      StudentStatusEnum.AwardingRejected
    ],
    [StudentStatusEnum.AwardingInProcess]: [
      StudentStatusEnum.Awarded,
      StudentStatusEnum.AwardingRejected
    ],
  };

  private cachedStatusOptions: { id: number; name: string }[] = [];
  private lastStatusForOptions: number | null | undefined = undefined;

  get availableStatusOptions(): { id: number; name: string }[] {
    if (this.isAwarded) {
      return [];
    }
    const currentId = this.student?.applicationStatusId;
    if (currentId === this.lastStatusForOptions && this.cachedStatusOptions.length > 0) {
      return this.cachedStatusOptions;
    }
    this.lastStatusForOptions = currentId;

    if (currentId !== undefined && currentId !== null && this.statusTransitions[currentId]?.length) {
      this.cachedStatusOptions = this.statusTransitions[currentId].map(id => ({
        id,
        name: this.studentStatusService.getName(id)
      }));
      return this.cachedStatusOptions;
    }
    this.cachedStatusOptions = [];
    return this.cachedStatusOptions;
  }

  trackByStatusOption(index: number, option: { id: number; name: string }): number {
    return option.id;
  }

  toggleStatusDropdown(event?: Event): void {
    if (this.isAwarded) return;
    if (event) {
      event.stopPropagation();
    }
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    if (this.isStatusDropdownOpen) {
      if (this.selectedNewStatusId !== null) {
        this.activeOptionIndex = this.availableStatusOptions.findIndex(o => o.id === this.selectedNewStatusId);
      } else {
        this.activeOptionIndex = -1;
      }
    } else {
      this.activeOptionIndex = -1;
    }
  }

  selectNewStatusOption(id: number | null, event?: Event): void {
    if (this.isAwarded) return;
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.selectedNewStatusId = id;
    this.isStatusDropdownOpen = false;
  }

  getSelectedNewStatusName(): string {
    if (this.isAwarded) return 'Status editing locked';
    if (this.selectedNewStatusId === null) return '';
    const opt = this.availableStatusOptions.find(x => x.id === this.selectedNewStatusId);
    return opt ? opt.name : this.studentStatusService.getName(this.selectedNewStatusId);
  }

  handleStatusDropdownKeydown(event: KeyboardEvent): void {
    if (this.isAwarded) return;
    const options = this.availableStatusOptions;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isStatusDropdownOpen) {
          this.isStatusDropdownOpen = true;
          this.activeOptionIndex = this.selectedNewStatusId !== null
            ? options.findIndex(o => o.id === this.selectedNewStatusId)
            : -1;
        } else {
          if (this.activeOptionIndex === -1) {
            this.selectNewStatusOption(null);
          } else if (this.activeOptionIndex >= 0 && this.activeOptionIndex < options.length) {
            this.selectNewStatusOption(options[this.activeOptionIndex].id);
          }
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isStatusDropdownOpen) {
          this.isStatusDropdownOpen = true;
          this.activeOptionIndex = -1;
        } else {
          if (this.activeOptionIndex < options.length - 1) {
            this.activeOptionIndex++;
          } else {
            this.activeOptionIndex = -1;
          }
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isStatusDropdownOpen) {
          this.isStatusDropdownOpen = true;
          this.activeOptionIndex = options.length - 1;
        } else {
          if (this.activeOptionIndex > -1) {
            this.activeOptionIndex--;
          } else {
            this.activeOptionIndex = options.length - 1;
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.isStatusDropdownOpen = false;
        break;
      case 'Tab':
        this.isStatusDropdownOpen = false;
        break;
    }
  }

  updateStatus(): void {
    if (this.isAwarded) return;
    if (!this.student || this.selectedNewStatusId === null || this.isUpdatingStatus) return;

    this.isUpdatingStatus = true;
    const newStatusName = this.getSelectedNewStatusName();
    const targetApplicationId = this.student?.applicationId || this.studentId;

    this.studentProgramService.changeStatus(targetApplicationId, {
      applicationStatusId: this.selectedNewStatusId,
      remarks: this.statusNotes ? this.statusNotes.trim() : (null as any)
    }).subscribe({
      next: (res) => {
        this.isUpdatingStatus = false;
        if (res.success) {
          this.notification.success(`Status updated to "${newStatusName}" successfully.`);
          this.selectedNewStatusId = null;
          this.statusNotes = '';
          this.refreshApplicationWorkflow();
        } else {
          this.notification.error(res.message || 'Failed to update student status.');
        }
      },
      error: (error) => {
        this.isUpdatingStatus = false;
        this.notification.handleBusinessError(error, 'An error occurred while updating status.');
      }
    });
  }

  // Placeholder for when timeline API is provided
  documents: StudentProgramDocument[] = [];
  studentHistory: any[] = [];
  isLoadingHistory: boolean = false;

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
          this.selectedNewStatusId = null;
          this.statusNotes = '';
          this.lastStatusForOptions = undefined;
          this.cachedStatusOptions = [];

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

          if (this.student.programId) {
            this.loadProgramLoadAndCost(this.student.programId);
          }

          const targetStudentId = this.student.studentId || this.studentId;
          this.loadHistory(targetStudentId);

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

  loadHistory(studentId?: number): void {
    const targetStudentId = studentId || this.student?.studentId || this.studentId;
    if (!targetStudentId) return;

    this.isLoadingHistory = true;
    this.studentProgramService.getHistory(targetStudentId).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        const rawHistory = (res?.success && Array.isArray(res.result)) ? res.result : [];
        this.buildTimeline(rawHistory);
      },
      error: () => {
        this.isLoadingHistory = false;
        this.buildTimeline([]);
      }
    });
  }

  private buildTimeline(backendHistory: StudentHistory[]): void {
    const items: any[] = [];

    for (const h of backendHistory) {
      const isRej = /reject|denied|fail/i.test(h.title || '') || /reject|denied|fail/i.test(h.description || '');
      items.push({
        ...h,
        title: h.title,
        description: h.description,
        createdDate: h.createdDate,
        state: isRej ? 'rej' : 'done'
      });
    }

    if (items.length === 0 && this.student?.actionDate) {
      items.push({
        title: 'Status Updated',
        description: `Status changed to ${this.student.applicationStatusName}`,
        createdDate: this.student.actionDate,
        state: 'done'
      });
    }

    items.sort((a, b) => {
      const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return timeB - timeA;
    });

    this.studentHistory = items;
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

  getRecommendationDocumentUrl(): string {
    const path = this.student?.recommendationLetterPath?.trim();
    return HelperMethods.getFileUrl(path);
  }

  getRecommendationFileName(): string {
    const path = this.student?.recommendationLetterPath?.trim();
    if (!path) return '';
    const parts = path.split(/[\/\\]/);
    const fileName = parts[parts.length - 1];
    return fileName || 'Recommendation Letter';
  }

  getDocumentIconClass(path?: string | null): string {
    if (!path) return 'fas fa-file-alt text-muted';
    const lower = path.toLowerCase();
    if (lower.endsWith('.pdf')) return 'fas fa-file-pdf text-danger';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
      return 'fas fa-file-image text-green';
    }
    return 'fas fa-file-alt text-muted';
  }

  previewRecommendation(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const rawPath = this.student?.recommendationLetterPath?.trim();
    if (!rawPath) {
      this.notification.info('Recommendation document is not available.');
      return;
    }

    const previewUrl = this.getRecommendationDocumentUrl();
    if (!previewUrl) {
      this.notification.error('Invalid recommendation document path.');
      return;
    }

    try {
      window.open(previewUrl, '_blank');
    } catch {
      this.notification.error('Failed to open the recommendation document.');
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

        this.studentProgramService.changeStatus(this.student?.applicationId || this.studentId, {
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
        this.studentProgramService.changeStatus(this.student?.applicationId || this.studentId, {
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
        this.studentProgramService.changeStatus(this.student?.applicationId || this.studentId, {
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
        this.studentProgramService.changeStatus(this.student?.applicationId || this.studentId, {
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
        this.studentProgramService.changeStatus(this.student?.applicationId || this.studentId, {
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



  // --- Program Load & Cost Calculations & Handlers ---
  get programCosts(): ProgramCost[] {
    return this.program?.costs || [];
  }

  get programCourses(): ProgramCourse[] {
    return this.program?.courses || [];
  }

  get programSemestersCount(): number {
    return this.program?.numberOfSemesters || 0;
  }

  get hasCostConfiguration(): boolean {
    return this.programCosts.length > 0;
  }

  get recurringCostsList(): ProgramCost[] {
    return this.programCosts.filter(c => c.frequencyTypeId !== 1);
  }

  get oneTimeCostsList(): ProgramCost[] {
    return this.programCosts.filter(c => c.frequencyTypeId === 1);
  }

  get oneTimeItemsCount(): number {
    return this.oneTimeCostsList.length;
  }

  get recurringPerSemester(): number {
    return this.recurringCostsList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  // 1. Grand Program Cost (recurring cost items x configured number of semesters)
  get grandRecurringCost(): number {
    return this.recurringPerSemester * this.programSemestersCount;
  }

  // 2. One-Time Items (sum of all one-time cost items)
  get oneTimeTotal(): number {
    return this.oneTimeCostsList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  // 3. Grand Total Program Cost (recurring program cost + one-time items)
  get grandTotalProgramCost(): number {
    return this.grandRecurringCost + this.oneTimeTotal;
  }

  // 4. Cost per Semester (grand total program cost / configured number of semesters)
  get costPerSemester(): number {
    if (this.programSemestersCount <= 0) return 0;
    return this.grandTotalProgramCost / this.programSemestersCount;
  }

  // 5. Total Course Credits (sum of credits of all configured courses across the program)
  get totalCourseCredits(): number {
    if (this.programCourses.length > 0) {
      return this.programCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    }
    return this.program?.creditsRequired || 0;
  }

  get totalCoursesCount(): number {
    return this.programCourses.length;
  }

  // 6. Cost per Credit (grand total program cost / total course credits)
  get costPerCredit(): number {
    if (this.totalCourseCredits <= 0) return 0;
    return this.grandTotalProgramCost / this.totalCourseCredits;
  }

  formatAmount(val: number): string {
    if (val == null || isNaN(val)) return '0.00';
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get grandRecurringCostFormatted(): string {
    return this.formatAmount(this.grandRecurringCost);
  }

  get oneTimeCostFormatted(): string {
    return this.formatAmount(this.oneTimeTotal);
  }

  get grandTotalCostFormatted(): string {
    return this.formatAmount(this.grandTotalProgramCost);
  }

  get costPerSemesterFormatted(): string {
    return this.formatAmount(this.costPerSemester);
  }

  get costPerCreditFormatted(): string {
    return this.formatAmount(this.costPerCredit);
  }

  get recurringPerSemesterFormatted(): string {
    return this.formatAmount(this.recurringPerSemester);
  }

  openFullCostModal(): void {
    this.isFullCostModalOpen = true;
  }

  closeFullCostModal(): void {
    this.isFullCostModalOpen = false;
  }

  loadProgramLoadAndCost(programId?: number): void {
    if (!programId) {
      this.program = null;
      return;
    }

    this.isProgramLoading = true;

    const curFilter = new MasterCurrencyFilter();
    curFilter.pageNumber = 1;
    curFilter.pageSize = 1000;
    this.masterCurrencyService.getMasterCurrencies(curFilter).subscribe({
      next: (cRes) => {
        if (cRes.success && cRes.result?.items) {
          this.currencies = cRes.result.items;
          this.resolveProgramCurrency();
        }
      }
    });

    this.programService.getProgramById(programId).subscribe({
      next: (res) => {
        this.isProgramLoading = false;
        if (res.success && res.result) {
          this.program = res.result;
          this.resolveProgramCurrency();
        }
      },
      error: () => {
        this.isProgramLoading = false;
      }
    });
  }

  resolveProgramCurrency(): void {
    // University program cost currency is SOS, matching programs-detail/:id
    this.programCurrency = 'SOS';
  }

}
