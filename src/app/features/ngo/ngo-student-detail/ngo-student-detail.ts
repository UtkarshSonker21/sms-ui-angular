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
import { StudentHistory } from '../../../core/models/school/student-program-application/student-history.model';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { SponsorshipAssignmentService } from '../../../core/services/ngo/sponsorship-assignment.service';
import { StudentCategoryService } from '../../../core/services/ngo/student-category.service';
import { StudentCategoryFilter } from '../../../core/models/ngo/student-category/student-category-filter.model';
import { StudentCategoryRequest } from '../../../core/models/ngo/student-category/student-category.request.model';
import {
  AssignDonorSponsorshipRequest,
  CreateSponsorshipAssignmentRequest,
  SponsorshipAssignment,
  SponsorshipAssignmentOption
} from '../../../core/models/ngo/sponsorshipMatrix/sponsorship-assignment.model';
import { ProgramService } from '../../../core/services/university/programs.service';
import { MasterCurrencyService } from '../../../core/services/superadmin/master-currency.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramCost } from '../../../core/models/university/programs/program-cost.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { MasterCurrencyFilter } from '../../../core/models/super-admin/master-currency/master-currency-filter.model';
import { MasterCurrencyRequest } from '../../../core/models/super-admin/master-currency/master-currency-request.model';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { StaffType } from '../../../core/enums/staff-type.enum';

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
  private programService = inject(ProgramService);
  private masterCurrencyService = inject(MasterCurrencyService);
  private userProfileService = inject(CurrentUserProfileService);

  get canViewAcademicRecord(): boolean {
    const profile = this.userProfileService.getCurrentUserProfile();
    return profile?.staffType === StaffType.Ngo ||
           profile?.staffType === StaffType.SuperAdmin ||
           profile?.staffType === StaffType.University;
  }

  viewAcademicRecord(): void {
    const targetId = this.student?.applicationId || this.studentId;
    if (targetId) {
      this.router.navigate(['/registered-student', targetId, 'academic-record']);
    }
  }

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

  // Currency
  selectedCurrency: 'KWD' | 'USD' | 'EUR' = 'KWD';

  // Placeholder for when timeline API is provided
  documents: StudentProgramDocument[] = [];
  studentHistory: any[] = [];
  isLoadingHistory: boolean = false;

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

  // Sponsorship modal channel & donor fields
  sponsorshipChannel: 'pool' | 'donor' = 'pool';
  donorName: string = '';
  donorCode: string = '';

  // Section toggle state
  activeSection: number = 1;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.studentId = +idParam;
      this.loadStudentDetails();
    }
  }

  selectCurrency(currency: 'KWD' | 'USD' | 'EUR'): void {
    this.selectedCurrency = currency;
  }

  scrollToBasicData(): void {
    const el = document.getElementById('basic-info-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }


  getAssignedCategoryDisplay(): string {
    if (this.student?.categoryName) return this.student.categoryName;
    if (this.sponsorshipAssignments.length > 0) {
      const active = this.sponsorshipAssignments.find(a => a.isActive) || this.sponsorshipAssignments[0];
      return active.categoryName || '-';
    }
    return '-';
  }

  getSponsorshipSourceDisplay(): string {
    if (this.student?.sponsorshipSource) {
      if (this.student.sponsorshipSource === 'Donor' && this.student.donorName) {
        return `Donor (${this.student.donorName})`;
      }
      return this.student.sponsorshipSource;
    }
    if (this.sponsorshipAssignments.length > 0) {
      const active = this.sponsorshipAssignments.find(a => a.isActive) || this.sponsorshipAssignments[0];
      if (active.donorName || active.donorCode) {
        return active.donorName ? `Donor (${active.donorName})` : 'Donor';
      }
      return 'Direct Aid Pool';
    }
    return '-';
  }

  getDonorNameDisplay(): string {
    if (this.student?.donorName) return this.student.donorName;
    if (this.sponsorshipAssignments.length > 0) {
      const active = this.sponsorshipAssignments.find(a => a.isActive) || this.sponsorshipAssignments[0];
      return active.donorName || '';
    }
    return '';
  }

  getDonorCodeDisplay(): string {
    if (this.student?.donorCode) return this.student.donorCode;
    if (this.sponsorshipAssignments.length > 0) {
      const active = this.sponsorshipAssignments.find(a => a.isActive) || this.sponsorshipAssignments[0];
      return active.donorCode || '-';
    }
    return '-';
  }

  loadStudentDetails(): void {
    this.studentProgramService.getById(this.studentId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.student = res.result;
          this.photoError = false;

          const targetStudentId = this.student.studentId || this.studentId;
          this.loadHistory(targetStudentId);

          if (this.student.applicationId) {
            this.loadDocuments(this.student.applicationId);
            this.loadSponsorshipAssignments(this.student.applicationId);
            this.loadSponsorshipCategories();
          }

          if (this.student.programId) {
            this.loadProgramLoadAndCost(this.student.programId);
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

  openSponsorshipAssignmentModal(channel: 'pool' | 'donor' = 'pool'): void {
    if (this.isLoadingSponsorshipCategories || this.sponsorshipCategories.length === 0) return;
    this.sponsorshipChannel = channel;
    this.editingSponsorshipAssignmentId = null;
    this.selectedSponsorshipCategoryId = null;
    this.isSponsorshipCategoryDropdownOpen = false;
    this.sponsorshipAssignmentOptions = [];
    this.sponsorshipOptionsError = '';
    this.sponsorshipAssignmentRemarks = '';
    this.donorName = '';
    this.donorCode = '';
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
    this.donorName = '';
    this.donorCode = '';
  }

  saveSponsorshipAssignment(): void {
    const applicationId = this.student?.applicationId;
    if (!applicationId) return;

    if (this.isSavingSponsorshipAssignment) return;

    if (!this.selectedSponsorshipCategoryId) {
      this.notification.warning('Please select a student sponsorship category.');
      return;
    }

    if (this.sponsorshipChannel === 'donor') {
      const trimmedDonorName = (this.donorName || '').trim();
      const trimmedDonorCode = (this.donorCode || '').trim();

      if (!trimmedDonorName) {
        this.notification.warning('Please enter the donor name.');
        return;
      }

      if (!trimmedDonorCode) {
        this.notification.warning('Please enter the donor code / reference.');
        return;
      }

      const donorRequest = new AssignDonorSponsorshipRequest();
      donorRequest.applicationId = applicationId;
      donorRequest.sponsorshipCategoryId = this.selectedSponsorshipCategoryId;
      donorRequest.donorName = trimmedDonorName;
      donorRequest.donorCode = trimmedDonorCode;
      donorRequest.remarks = this.sponsorshipAssignmentRemarks?.trim() || null;

      this.isSavingSponsorshipAssignment = true;
      this.sponsorshipAssignmentService.assignDonor(applicationId, donorRequest).subscribe({
        next: (res) => {
          this.isSavingSponsorshipAssignment = false;
          if (res.success) {
            this.isSponsorshipAssignmentModalOpen = false;
            this.editingSponsorshipAssignmentId = null;
            this.notification.success(res.message || 'Donor sponsorship assignment saved successfully.');
            this.loadStudentDetails();
            this.loadSponsorshipAssignments(applicationId);
          } else {
            this.notification.error(res.message || 'Failed to save the donor sponsorship assignment.');
          }
        },
        error: (error) => {
          this.isSavingSponsorshipAssignment = false;
          this.notification.handleBusinessError(error, 'Failed to save the donor sponsorship assignment.');
        }
      });
      return;
    }

    if (this.isLoadingSponsorshipOptions || this.sponsorshipOptionsError
      || this.sponsorshipAssignmentOptions.length === 0) {
      return;
    }

    const request = new CreateSponsorshipAssignmentRequest();
    request.studentCategoryId = this.selectedSponsorshipCategoryId;
    request.remarks = this.sponsorshipAssignmentRemarks?.trim() || null;

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
          this.loadStudentDetails();
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

    this.sponsorshipChannel = assignment.donorName ? 'donor' : 'pool';
    this.editingSponsorshipAssignmentId = assignment.assignmentId;
    this.selectedSponsorshipCategoryId = assignment.studentCategoryId;
    this.sponsorshipAssignmentRemarks = assignment.remarks || '';
    this.sponsorshipOptionsError = '';
    this.donorName = assignment.donorName || '';
    this.donorCode = assignment.donorCode || '';
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
  getStatusBadgeClass(student: StudentProgramApplication | null): string {
    if (!student) return 'st-process';
    const st = student.applicationStatusId;
    switch (st) {
      case StudentStatusEnum.Awarded: return 'st-awarded';
      case StudentStatusEnum.Sponsored: return 'st-sponsored';
      case StudentStatusEnum.Registered: return 'st-registered';
      case StudentStatusEnum.Graduated: return 'st-graduated';
      case StudentStatusEnum.SponsoringRejected:
      case StudentStatusEnum.AcceptanceRejected:
        return 'st-rejected';
      case StudentStatusEnum.AcceptanceInProcess:
      case StudentStatusEnum.SponsoringInProcess:
      case StudentStatusEnum.AwardingInProcess:
        return 'st-process';
      case StudentStatusEnum.Accepted:
        return 'st-accepted';
      default:
        return 'st-process';
    }
  }

  getJourneySteps(): { title: string; state: 'done' | 'cur' | 'rej' | 'future' }[] {
    const statusId = this.student?.applicationStatusId;
    if (statusId === StudentStatusEnum.AcceptanceRejected || statusId === StudentStatusEnum.SponsoringRejected) {
      return [
        { title: 'In Process', state: 'done' },
        { title: 'Rejected', state: 'rej' }
      ];
    }

    const stages = [
      { id: StudentStatusEnum.AcceptanceInProcess, title: 'In Process' },
      { id: StudentStatusEnum.Accepted, title: 'Accepted' },
      { id: StudentStatusEnum.Awarded, title: 'Awarded' },
      { id: StudentStatusEnum.Sponsored, title: 'Sponsored' },
      { id: StudentStatusEnum.Registered, title: 'Registered' },
      { id: StudentStatusEnum.Graduated, title: 'Graduated' },
    ];

    let currentIdx = stages.findIndex(s => s.id === statusId);
    if (statusId === StudentStatusEnum.SponsoringInProcess) {
      currentIdx = 2; // In awarding/sponsorship review
    }
    if (currentIdx === -1) currentIdx = 0;

    return stages.map((s, idx) => ({
      title: s.title,
      state: idx < currentIdx ? 'done' : (idx === currentIdx ? 'cur' : 'future')
    }));
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
    const items: { title: string; description?: string; createdDate?: Date | string; state: 'done' | 'rej' }[] = [];

    for (const h of backendHistory) {
      const isRej = /reject|denied|fail/i.test(h.title || '') || /reject|denied|fail/i.test(h.description || '');
      items.push({
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

  getUploadedDocumentsCount(): number {
    return this.documents.filter(d => this.getUploadedDocStatus(d.documentTypeId) === 'Uploaded').length;
  }

  private refreshApplicationWorkflow(): void {
    this.loadStudentDetails();
  }

  markDonorSponsored(): void {
    this.openSponsorshipAssignmentModal('donor');
  }

  submitForSponsorshipReview(): void {
    if (!this.student) return;
    const targetApplicationId = this.student.applicationId || this.studentId;

    this.confirmDialog.confirm({
      title: 'Submit for Sponsorship Review?',
      message: 'The application will be forwarded for sponsorship review.\n\nDo you want to continue?',
      confirmText: 'Submit',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(targetApplicationId, {
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
    const targetApplicationId = this.student.applicationId || this.studentId;

    this.confirmDialog.confirm({
      title: 'Reject Sponsorship',
      message: 'Are you sure you want to reject this sponsorship application?',
      confirmText: 'Yes, Reject',
      cancelText: 'Cancel',
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(targetApplicationId, {
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
    const targetApplicationId = this.student.applicationId || this.studentId;

    this.confirmDialog.confirm({
      title: 'Approve Sponsorship',
      message: 'Are you sure you want to approve this sponsorship application?',
      confirmText: 'Yes, Approve',
      cancelText: 'Cancel',
      variant: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.studentProgramService.changeStatus(targetApplicationId, {
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
    return this.programCosts.filter(c => c.frequencyTypeId !== undefined && c.frequencyTypeId !== 1);
  }

  get oneTimeCostsList(): ProgramCost[] {
    return this.programCosts.filter(c => c.frequencyTypeId !== undefined && c.frequencyTypeId === 1);
  }

  get oneTimeItemsCount(): number {
    return this.oneTimeCostsList.length;
  }

  get recurringPerSemester(): number {
    return this.recurringCostsList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  // 1. Grand Program Cost (recurring cost items Ã— total semesters)
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

  // 4. Cost per Semester (grand total Ã· total semesters)
  get costPerSemester(): number {
    if (this.programSemestersCount <= 0) return 0;
    return this.grandTotalProgramCost / this.programSemestersCount;
  }

  // 5. Total Course Credits (sum of credits of all configured courses across the program)
  get totalCoursesCredits(): number {
    if (!this.programCourses || this.programCourses.length === 0) return 0;
    return this.programCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }

  get totalCourseCredits(): number {
    return this.totalCoursesCredits > 0 ? this.totalCoursesCredits : (this.program?.creditsRequired || 0);
  }

  get totalCoursesCount(): number {
    return this.programCourses.length;
  }

  // 6. Cost per Credit (grand total Ã· total course credits)
  get costPerCredit(): number {
    if (this.totalCourseCredits <= 0) return 0;
    return this.grandTotalProgramCost / this.totalCourseCredits;
  }

  formatCostAmount(val: number): string {
    if (val == null || isNaN(val) || !isFinite(val)) return '-';
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get grandRecurringCostFormatted(): string {
    return this.formatCostAmount(this.grandRecurringCost);
  }

  get oneTimeCostFormatted(): string {
    return this.formatCostAmount(this.oneTimeTotal);
  }

  get grandTotalCostFormatted(): string {
    return this.formatCostAmount(this.grandTotalProgramCost);
  }

  get costPerSemesterFormatted(): string {
    return this.formatCostAmount(this.costPerSemester);
  }

  get costPerCreditFormatted(): string {
    return this.formatCostAmount(this.costPerCredit);
  }

  get recurringPerSemesterFormatted(): string {
    return this.formatCostAmount(this.recurringPerSemester);
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
    if (!this.student) return;
    if (this.currencies && this.currencies.length > 0 && this.student.universityCountryId) {
      const match = this.currencies.find(c => c.countryId === this.student?.universityCountryId);
      if (match?.currencyCode) {
        this.programCurrency = match.currencyCode;
        return;
      }
    }
    const country = (this.student.universityCountryName || '').toLowerCase();
    if (country.includes('somalia')) {
      this.programCurrency = 'SOS';
      return;
    }
    if (country.includes('kuwait')) {
      this.programCurrency = 'KWD';
      return;
    }
    if (country.includes('kenya')) {
      this.programCurrency = 'KES';
      return;
    }
    this.programCurrency = 'SOS';
  }
}
