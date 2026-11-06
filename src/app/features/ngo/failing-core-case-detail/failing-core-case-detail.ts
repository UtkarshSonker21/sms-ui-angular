import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FailingCoreCaseService } from '../../../core/services/ngo/failing-core-case.service';
import {
  FailingCoreCaseCourseModel,
  FailingCoreCaseModel,
  FailingCoreCaseStatus
} from '../../../core/models/ngo/failing-core-cases/failing-core-case.model';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { StudentHistory } from '../../../core/models/school/student-program-application/student-history.model';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramCost } from '../../../core/models/university/programs/program-cost.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { MasterCurrencyService } from '../../../core/services/superadmin/master-currency.service';
import { MasterCurrencyFilter } from '../../../core/models/super-admin/master-currency/master-currency-filter.model';
import { MasterCurrencyRequest } from '../../../core/models/super-admin/master-currency/master-currency-request.model';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { NotificationService } from '../../../core/services/common/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ApiService } from '../../../core/services/common/api.service';
import { ApiResponse } from '../../../core/models/common/response/api-response.model';

export type FailingCoreDecisionOption = 'Pending' | 'Approved' | 'Denied';

export interface TimelineLogItem {
  title: string;
  description?: string;
  createdDate?: Date | string | null;
  state?: 'done' | 'rej' | 'cur';
}

@Component({
  selector: 'app-failing-core-case-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './failing-core-case-detail.html',
  styleUrl: './failing-core-case-detail.scss',
})
export class FailingCoreCaseDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly failingCoreCaseService = inject(FailingCoreCaseService);
  private readonly studentProgramService = inject(StudentProgramService);
  private readonly programService = inject(ProgramService);
  private readonly masterCurrencyService = inject(MasterCurrencyService);
  private readonly notification = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly apiService = inject(ApiService);

  caseId: number = 0;
  caseDetail: FailingCoreCaseModel | null = null;
  student: StudentProgramApplication | null = null;
  program: ProgramRequest | null = null;
  currencies: MasterCurrencyRequest[] = [];
  programCurrency: string = 'KWD';
  selectedCurrency: 'KWD' | 'USD' | 'EUR' = 'KWD';
  ratesMap: Record<string, number> = {
    KWD: 1.0,
    USD: 3.25,
    EUR: 3.0,
    SOS: 1860.0,
    KES: 420.0
  };

  historyTimeline: TimelineLogItem[] = [];
  rawHistoryItems: StudentHistory[] = [];

  isLoading = true;
  isLoadingStudent = false;
  isProgramLoading = false;
  isLoadingHistory = false;
  loadError = '';

  selectedDecisionStatus: FailingCoreDecisionOption = 'Pending';
  isStatusDropdownOpen = false;
  decisionComment = '';
  isSavingDecision = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = Number(idParam);
    if (Number.isSafeInteger(parsedId) && parsedId > 0) {
      this.caseId = parsedId;
      this.loadCurrencies();
      this.loadRates();
      this.loadCaseDetails(parsedId);
    } else {
      this.isLoading = false;
      this.loadError = 'A valid failing-core case ID was not specified in the URL.';
    }
  }

  loadCaseDetails(id: number): void {
    this.isLoading = true;
    this.loadError = '';
    this.failingCoreCaseService.getById(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response?.success && response.result) {
          this.caseDetail = response.result;
          this.selectedDecisionStatus = (this.caseDetail.status as FailingCoreDecisionOption) || 'Pending';
          this.decisionComment = this.caseDetail.decisionComment || '';
          if (this.caseDetail.applicationId) {
            this.loadStudentApplication(this.caseDetail.applicationId);
          }
          if (this.caseDetail.programId) {
            this.loadProgram(this.caseDetail.programId);
          }
          if (this.caseDetail.studentId) {
            this.loadHistory(this.caseDetail.studentId);
          } else {
            this.buildTimeline([]);
          }
        } else {
          this.caseDetail = null;
          this.loadError = response?.message || 'Failing-core case could not be found.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.caseDetail = null;
        this.loadError = this.errorMessage(error, 'Failing-core case details could not be loaded.');
      }
    });
  }

  private loadCurrencies(): void {
    const curFilter = new MasterCurrencyFilter();
    curFilter.pageNumber = 1;
    curFilter.pageSize = 1000;
    this.masterCurrencyService.getMasterCurrencies(curFilter).subscribe({
      next: (cRes) => {
        if (cRes?.success && cRes.result?.items) {
          this.currencies = cRes.result.items;
          this.resolveProgramCurrency();
        }
      }
    });
  }

  private loadStudentApplication(applicationId: number): void {
    this.isLoadingStudent = true;
    this.studentProgramService.getById(applicationId).subscribe({
      next: (res) => {
        this.isLoadingStudent = false;
        if (res?.success && res.result) {
          this.student = res.result;
          if (!this.program && this.student.programId) {
            this.loadProgram(this.student.programId);
          }
          if (!this.rawHistoryItems.length && this.student.studentId) {
            this.loadHistory(this.student.studentId);
          }
          this.resolveProgramCurrency();
        }
      },
      error: () => {
        this.isLoadingStudent = false;
      }
    });
  }

  private loadProgram(programId: number): void {
    this.isProgramLoading = true;
    this.programService.getProgramById(programId).subscribe({
      next: (res) => {
        this.isProgramLoading = false;
        if (res?.success && res.result) {
          this.program = res.result;
          this.resolveProgramCurrency();
        }
      },
      error: () => {
        this.isProgramLoading = false;
      }
    });
  }

  private loadHistory(studentId: number): void {
    this.isLoadingHistory = true;
    this.studentProgramService.getHistory(studentId).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        this.rawHistoryItems = (res?.success && Array.isArray(res.result)) ? res.result : [];
        this.buildTimeline(this.rawHistoryItems);
      },
      error: () => {
        this.isLoadingHistory = false;
        this.rawHistoryItems = [];
        this.buildTimeline([]);
      }
    });
  }

  private buildTimeline(backendHistory: StudentHistory[]): void {
    const items: TimelineLogItem[] = [];

    for (const h of backendHistory) {
      const isRej = /reject|denied|fail/i.test(h.title || '') || /reject|denied|fail/i.test(h.description || '');
      items.push({
        title: h.title,
        description: h.description,
        createdDate: h.createdDate,
        state: isRej ? 'rej' : 'done'
      });
    }

    // Synthesize failing-core case submission event if present
    if (this.caseDetail?.submittedOn) {
      const failedNames = (this.caseDetail.failedCoreCourses || []).map(c => c.courseName).join(', ');
      const desc = failedNames
        ? `Failed core course(s) review requested: ${failedNames}`
        : 'Failing core course review submitted to Direct Aid Committee';
      const exists = items.some(i => i.title?.toLowerCase().includes('failing-core'));
      if (!exists) {
        items.push({
          title: 'Failing-Core Case Submitted',
          description: desc,
          createdDate: this.caseDetail.submittedOn,
          state: 'done'
        });
      }
    }

    // Synthesize decision event if resolved
    if (this.caseDetail?.decisionOn || (this.caseDetail?.status && this.caseDetail.status !== 'Pending')) {
      const isDenied = this.caseDetail?.status === 'Denied';
      const title = this.caseDetail?.status === 'Approved'
        ? 'Continuation Approved by Committee'
        : (this.caseDetail?.status === 'Denied' ? 'Continuation Denied by Committee' : `Committee Decision: ${this.caseDetail?.status}`);
      const exists = items.some(i => i.title?.toLowerCase().includes('continuation') || i.title?.toLowerCase().includes('committee decision'));
      if (!exists) {
        items.push({
          title,
          description: this.caseDetail?.decisionComment || 'Committee decision recorded',
          createdDate: this.caseDetail?.decisionOn || new Date(),
          state: isDenied ? 'rej' : 'done'
        });
      }
    }

    // Sort descending by date (newest first)
    items.sort((a, b) => {
      const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return timeB - timeA;
    });

    this.historyTimeline = items;
  }

  resolveProgramCurrency(): void {
    if (this.currencies && this.currencies.length > 0 && this.student?.universityCountryId) {
      const match = this.currencies.find(c => c.countryId === this.student?.universityCountryId);
      if (match?.currencyCode) {
        this.programCurrency = match.currencyCode;
        return;
      }
    }
    const country = (this.student?.universityCountryName || '').toLowerCase();
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
    this.programCurrency = 'KWD';
  }

  // --- Program Load & Cost Getters ---
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

  get grandRecurringCost(): number {
    return this.recurringPerSemester * this.programSemestersCount;
  }

  get oneTimeTotal(): number {
    return this.oneTimeCostsList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  get grandTotalProgramCost(): number {
    return this.grandRecurringCost + this.oneTimeTotal;
  }

  get costPerSemester(): number {
    if (this.programSemestersCount <= 0) return 0;
    return this.grandTotalProgramCost / this.programSemestersCount;
  }

  get totalCoursesCredits(): number {
    if (!this.programCourses || this.programCourses.length === 0) return 0;
    return this.programCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }

  get totalCourseCredits(): number {
    return this.totalCoursesCredits > 0 ? this.totalCoursesCredits : (this.program?.creditsRequired || 0);
  }

  get costPerCredit(): number {
    if (this.totalCourseCredits <= 0) return 0;
    return this.grandTotalProgramCost / this.totalCourseCredits;
  }

  formatCostAmount(val: number): string {
    if (val == null || isNaN(val) || !isFinite(val)) return 'â€”';
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  get grandRecurringCostFormatted(): string {
    return this.formatCostAmount(this.convertCost(this.grandRecurringCost));
  }

  get oneTimeCostFormatted(): string {
    return this.formatCostAmount(this.convertCost(this.oneTimeTotal));
  }

  get grandTotalCostFormatted(): string {
    return this.formatCostAmount(this.convertCost(this.grandTotalProgramCost));
  }

  get costPerSemesterFormatted(): string {
    return this.formatCostAmount(this.convertCost(this.costPerSemester));
  }

  get costPerCreditFormatted(): string {
    return this.formatCostAmount(this.convertCost(this.costPerCredit));
  }

  get highSchoolDivisionsList(): string[] {
    if (!this.program?.allowedHighSchoolDivisions) return [];
    return this.program.allowedHighSchoolDivisions
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  getJourneySteps(): { title: string; state: 'done' | 'cur' | 'future' }[] {
    const statusId = this.student?.applicationStatusId ?? StudentStatusEnum.Registered;
    const stages = [
      { id: StudentStatusEnum.Draft, title: 'In Process' },
      { id: StudentStatusEnum.Accepted, title: 'Accepted' },
      { id: StudentStatusEnum.Awarded, title: 'Awarded' },
      { id: StudentStatusEnum.Sponsored, title: 'Sponsored' },
      { id: StudentStatusEnum.Registered, title: 'Registered' },
      { id: StudentStatusEnum.Graduated, title: 'Graduated' },
    ];

    let currentIdx = 4; // Registered by default for failing core cases
    if (statusId === StudentStatusEnum.Graduated) {
      currentIdx = 5;
    } else if (statusId >= StudentStatusEnum.Registered) {
      currentIdx = 4;
    } else if (statusId >= StudentStatusEnum.Sponsored) {
      currentIdx = 3;
    } else if (statusId >= StudentStatusEnum.Awarded) {
      currentIdx = 2;
    } else if (statusId >= StudentStatusEnum.Accepted) {
      currentIdx = 1;
    } else {
      currentIdx = 0;
    }

    return stages.map((s, idx) => ({
      title: s.title,
      state: idx < currentIdx ? 'done' : (idx === currentIdx ? 'cur' : 'future')
    }));
  }

  selectCurrency(currency: 'KWD' | 'USD' | 'EUR'): void {
    this.selectedCurrency = currency;
  }

  loadRates(): void {
    this.apiService.get<ApiResponse<any[]>>('superadmin/currency-conversion/latest-rates').subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.result)) {
          res.result.forEach((item: any) => {
            if (item.currencyCode && item.rates) {
              this.ratesMap[item.currencyCode.toUpperCase()] = Number(item.rates);
            }
          });
        }
      },
      error: () => {
        // Fallback default conversion rates active
      }
    });
  }

  convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    if (!amount || isNaN(amount) || fromCurrency === toCurrency) return amount;
    const fromRate = this.ratesMap[fromCurrency.toUpperCase()] || 1.0;
    const toRate = this.ratesMap[toCurrency.toUpperCase()] || 1.0;
    const inBaseKwd = amount / fromRate;
    return inBaseKwd * toRate;
  }

  convertCost(amount: number): number {
    if (!amount || isNaN(amount)) return 0;
    const fromCur = this.programCurrency || 'KWD';
    const toCur = this.selectedCurrency || 'KWD';
    return this.convertAmount(amount, fromCur, toCur);
  }

  scrollToBasicData(): void {
    const el = document.getElementById('basic-info-section');
    if (!el) return;

    const scrollContainer = el.closest('.main-layout__content') as HTMLElement | null;
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetTop = elRect.top - containerRect.top + scrollContainer.scrollTop - 20;
      scrollContainer.scrollTo({ top: offsetTop, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToLogHistory(): void {
    const el = document.getElementById('fc-log-history-section');
    if (!el) return;

    const scrollContainer = el.closest('.main-layout__content') as HTMLElement | null;
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetTop = elRect.top - containerRect.top + scrollContainer.scrollTop - 20;
      scrollContainer.scrollTo({ top: offsetTop, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goBack(): void {
    this.router.navigate(['/failing-core-cases']);
  }

  toggleStatusDropdown(event: Event): void {
    event.stopPropagation();
    if (this.caseDetail?.status !== 'Pending') {
      return;
    }
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  selectStatus(status: FailingCoreDecisionOption): void {
    if (this.caseDetail?.status !== 'Pending') {
      return;
    }
    this.selectedDecisionStatus = status;
    this.isStatusDropdownOpen = false;
  }

  getDecisionStatusLabel(status?: string): string {
    switch (status) {
      case 'Approved':
        return 'Continuation approved';
      case 'Denied':
        return 'Continuation denied';
      case 'Pending':
      default:
        return 'Pending';
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isStatusDropdownOpen = false;
  }

  async updateDecision(): Promise<void> {
    if (this.isSavingDecision || !this.caseDetail) return;

    if (this.caseDetail.status !== 'Pending') {
      this.notification.warning('A committee decision has already been recorded for this case.');
      return;
    }

    if (this.selectedDecisionStatus === 'Pending') {
      this.notification.warning('Please select Continuation approved or Continuation denied before submitting.');
      return;
    }

    const comment = this.decisionComment.trim();
    if (!comment) {
      this.notification.warning('A committee comment is required before recording a decision.');
      return;
    }
    if (comment.length > 2000) {
      this.notification.warning('The committee comment cannot exceed 2,000 characters.');
      return;
    }

    const isApproval = this.selectedDecisionStatus === 'Approved';
    const studentDisplayName = this.caseDetail.studentName || this.student?.fullName || 'the student';
    const confirmed = await this.confirmDialog.confirm({
      title: isApproval ? 'Approve Sponsorship Continuation' : 'Deny Sponsorship Continuation',
      message: isApproval
        ? `Are you sure you want to approve sponsorship continuation for ${studentDisplayName}? The student will be permitted to register for the next semester with the failed core course as a re-take.`
        : `Are you sure you want to deny sponsorship continuation for ${studentDisplayName}? The student's academic progression will remain on hold.`,
      confirmText: isApproval ? 'Approve Continuation' : 'Deny Continuation',
      cancelText: 'Cancel',
      variant: isApproval ? 'info' : 'danger'
    });

    if (confirmed) {
      this.submitDecision(this.selectedDecisionStatus);
    }
  }

  private submitDecision(status: Extract<FailingCoreCaseStatus, 'Approved' | 'Denied'>): void {
    if (!this.caseDetail || this.isSavingDecision) return;

    this.isSavingDecision = true;
    this.failingCoreCaseService.recordDecision(this.caseId, {
      status,
      comment: this.decisionComment.trim(),
      expectedRowVersion: this.caseDetail.rowVersion
    }).subscribe({
      next: (response) => {
        this.isSavingDecision = false;
        if (response?.success && response.result) {
          this.notification.success(response.message || 'Committee decision recorded successfully.');
          this.caseDetail = response.result;
          this.selectedDecisionStatus = (this.caseDetail.status as FailingCoreDecisionOption) || status;
          this.decisionComment = this.caseDetail.decisionComment || this.decisionComment;
          this.buildTimeline(this.rawHistoryItems);
        } else {
          this.notification.error(response?.message || 'The committee decision could not be saved.');
        }
      },
      error: (error) => {
        this.isSavingDecision = false;
        this.notification.handleBusinessError(error, 'The committee decision could not be saved. Reload the case before retrying.');
      }
    });
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'Pending':
        return 'st-awarded';
      case 'Approved':
        return 'st-registered';
      case 'Denied':
        return 'st-rejected';
      default:
        return 'st-process';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'Pending':
        return 'Pending';
      case 'Approved':
        return 'Approved';
      case 'Denied':
        return 'Denied';
      default:
        return status || 'â€”';
    }
  }

  getOutcomeBadgeClass(isPassed: boolean | null): string {
    if (isPassed === true) return 'st-registered';
    if (isPassed === false) return 'st-rejected';
    return 'st-process';
  }

  getOutcomeText(isPassed: boolean | null): string {
    if (isPassed === true) return 'Pass';
    if (isPassed === false) return 'Fail';
    return 'Pending';
  }

  getStudentScore(): string {
    if (this.student?.highSchoolRelativeGradeOrPercentage != null) {
      return `${this.student.highSchoolRelativeGradeOrPercentage}%`;
    }
    if (this.student?.highSchoolTotalScore != null) {
      if (this.student.highSchoolMaxScore != null && this.student.highSchoolMaxScore > 0) {
        const pct = Math.round((this.student.highSchoolTotalScore / this.student.highSchoolMaxScore) * 100);
        return `${pct}%`;
      }
      return `${this.student.highSchoolTotalScore}%`;
    }
    return '-';
  }

  getDonorReference(): string {
    if (this.student?.donorCode && this.student?.donorName) {
      return `${this.student.donorName} (${this.student.donorCode})`;
    }
    return this.student?.donorCode || this.student?.donorName || '-';
  }

  getStudentStatusBadgeClass(): string {
    const statusName = (this.student?.applicationStatusName || 'Registered').toLowerCase();
    if (statusName.includes('registered')) return 'st-registered';
    if (statusName.includes('sponsored')) return 'st-sponsored';
    if (statusName.includes('awarded')) return 'st-awarded';
    if (statusName.includes('accepted')) return 'st-accepted';
    if (statusName.includes('graduated')) return 'st-graduated';
    if (statusName.includes('rejected') || statusName.includes('denied')) return 'st-rejected';
    return 'st-process';
  }

  getStudentStatusLabel(): string {
    return this.student?.applicationStatusName || 'Registered';
  }

  get failedCoreCourses(): FailingCoreCaseCourseModel[] {
    if (this.caseDetail?.failedCoreCourses && this.caseDetail.failedCoreCourses.length > 0) {
      return this.caseDetail.failedCoreCourses;
    }
    if (this.caseDetail?.semesterCourses && this.caseDetail.semesterCourses.length > 0) {
      const failed = this.caseDetail.semesterCourses.filter(
        c => (c.courseType?.toLowerCase() === 'core' || c.courseType === '1') && c.isPassed === false
      );
      if (failed.length > 0) {
        return failed.map(c => ({
          studentCourseResultId: 0,
          programCourseId: 0,
          courseId: 0,
          courseCode: c.courseCode,
          courseName: c.courseName,
          credits: c.credits
        }));
      }
    }
    return [];
  }

  viewAcademicRecord(): void {
    const targetId = this.caseDetail?.applicationId || this.caseDetail?.studentId || this.student?.applicationId || this.student?.studentId;
    if (targetId) {
      this.router.navigate(['/registered-student', targetId, 'academic-record']);
    }
  }

  getFailedCoursePillLabel(course: FailingCoreCaseCourseModel): string {
    if (!course?.courseName) return '';
    const trimmed = course.courseName.trim();
    if (/\(core\)$/i.test(trimmed)) {
      return trimmed;
    }
    return trimmed + ' (core)';
  }

  private errorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as HttpErrorResponse)?.error?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : fallback;
  }
}
