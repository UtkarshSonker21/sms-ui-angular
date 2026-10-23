import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';

import { AcademicCalendarRequest } from '../../../core/models/university/academic-calendar/academic-calendar-request.model';
import { AcademicCalendarResponse } from '../../../core/models/university/academic-calendar/academic-calendar-response.model';
import { AcademicTermRequest } from '../../../core/models/university/academic-calendar/academic-term-request.model';
import { ApiResponse } from '../../../core/models/common/response/api-response.model';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { NotificationService } from '../../../core/services/common/notification.service';
import { AcademicCalendarService } from '../../../core/services/university/academic-calendar.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-academic-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, OverlayModule],
  templateUrl: './academic-calendar.html',
  styleUrl: './academic-calendar.scss',
})
export class AcademicCalendarComponent implements OnInit {
  private readonly calendarService = inject(AcademicCalendarService);
  private readonly currentUserProfileService = inject(CurrentUserProfileService);
  private readonly notification = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialogRef = inject(MatDialogRef<AcademicCalendarComponent>);
  calendars: AcademicCalendarResponse[] = [];
  universityId: number | null = null;
  screen: 'list' | 'form' = 'list';
  formStep: 1 | 2 = 1;
  isLoading = false;
  isSaving = false;
  isLoadingCalendar = false;
  isLoadingReusableConfiguration = false;
  dropdownWidth = 0;
  readonly dropdownPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];
  openDropdown: 'academicYearStartMonth' | 'academicYearEndMonth' | 'termsPerYear' | 'namingStyle' | null = null;
  calendarLoadFailed = false;
  hasLoadError = false;
  loadErrorMessage = '';
  attemptedSubmit = false;
  formErrorMessage = '';
  editingCalendarId: number | null = null;
  calendar = this.createEmptyCalendar();
  readonly namingStyles = ['Term', 'Semester', 'Seasonal', 'Custom'];
  readonly months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  ngOnInit(): void {
    const profile = this.currentUserProfileService.getCurrentUserProfile();
    this.universityId = profile?.universityIds?.[0] ?? null;

    if (!this.universityId) {
      this.hasLoadError = true;
      this.loadErrorMessage = 'No University is associated with the current account.';
      return;
    }

    this.loadCalendars();
  }

  loadCalendars(): void {
    if (!this.universityId) return;

    this.isLoading = true;
    this.hasLoadError = false;
    this.loadErrorMessage = '';
    this.calendarService.getCalendarsByUniversity(this.universityId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.result) {
          this.calendars = response.result;
          return;
        }

        this.calendars = [];
        this.hasLoadError = true;
        this.loadErrorMessage = response.message || 'Unable to load academic calendars.';
      },
      error: (error) => {
        this.isLoading = false;
        this.calendars = [];
        this.hasLoadError = true;
        this.loadErrorMessage = error?.error?.message ?? error?.error?.Message ?? 'Unable to load academic calendars.';
        this.notification.handleBusinessError(error, 'Failed to load academic calendars.');
      }
    });
  }

  startCreate(): void {
    this.syncUniversityContext();
    if (!this.universityId) return;
    this.editingCalendarId = null;
    this.calendar = this.createEmptyCalendar();
    this.resetFormState();
    this.calendarLoadFailed = false;
    this.formStep = 1;
    this.screen = 'form';
    this.loadReusableConfiguration();
  }

  editCalendar(item: AcademicCalendarResponse): void {
    this.syncUniversityContext();
    this.editingCalendarId = item.academicCalendarId;
    this.resetFormState();
    this.calendarLoadFailed = false;
    this.formStep = 1;
    this.isLoadingCalendar = true;
    this.screen = 'form';
    this.calendarService.getCalendarById(item.academicCalendarId).subscribe({
      next: (response) => {
        this.isLoadingCalendar = false;
        if (!response.success || !response.result) {
          this.formErrorMessage = response.message || 'Unable to load this academic calendar.';
          this.calendarLoadFailed = true;
          return;
        }

        const source = response.result;
        this.calendar = new AcademicCalendarRequest();
        this.calendar.universityId = source.universityId;
        this.calendar.academicYearName = source.academicYearName;
        this.calendar.periodStartDate = source.periodStartDate;
        this.calendar.periodEndDate = source.periodEndDate;
        this.calendar.academicYearStartMonth = source.academicYearStartMonth;
        this.calendar.academicYearEndMonth = source.academicYearEndMonth;
        this.calendar.termsPerYear = source.termsPerYear;
        this.calendar.namingStyle = this.isNamingStyle(source.namingStyle) ? source.namingStyle : 'Term';
        this.calendar.terms = source.terms
          .slice()
          .sort((a, b) => a.termSequence - b.termSequence)
          .map(term => ({
            termSequence: term.termSequence,
            termName: term.termName
          }));
      },
      error: (error) => {
        this.isLoadingCalendar = false;
        this.formErrorMessage = error?.error?.message ?? error?.error?.Message ?? 'Unable to load this academic calendar.';
        this.calendarLoadFailed = true;
        this.notification.handleBusinessError(error, 'Failed to load academic calendar.');
      }
    });
  }

  async changeTermsPerYear(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement;
    const count = Number(target.value);
    if (count !== 2 && count !== 3 && count !== 4) return;

    const currentCount = this.calendar.termsPerYear;
    if (count < currentCount) {
      const removedTerms = this.calendar.terms.slice(count);
      const hasEnteredData = removedTerms.some(term => !!term.termName);

      if (hasEnteredData) {
        const confirmed = await this.confirmDialog.confirm({
          title: 'Remove term details?',
          message: `Reducing the calendar to ${count} terms will discard the entered details for ${removedTerms.length} term${removedTerms.length === 1 ? '' : 's'}. Continue?`,
          confirmText: 'Remove terms',
          cancelText: 'Keep terms',
          variant: 'warning'
        });
        if (!confirmed) {
          target.value = String(currentCount);
          return;
        }
      }

      this.calendar.terms = this.calendar.terms.slice(0, count);
    } else if (count > currentCount) {
      for (let sequence = currentCount + 1; sequence <= count; sequence++) {
        const term = new AcademicTermRequest();
        term.termSequence = sequence;
        this.calendar.terms.push(term);
      }
    }

    this.calendar.termsPerYear = count;
    this.calendar.terms.forEach((term, index) => term.termSequence = index + 1);
  }

  goToTerms(form: NgForm): void {
    this.attemptedSubmit = true;
    form.control.markAllAsTouched();
    if (form.invalid || this.isLoadingReusableConfiguration || this.getAcademicYearValidationErrors().length > 0) return;

    this.attemptedSubmit = false;
    this.formStep = 2;
  }

  goToAcademicYear(): void {
    this.formStep = 1;
    this.attemptedSubmit = false;
    this.formErrorMessage = '';
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.openDropdown = null;
  }

  toggleDropdown(name: NonNullable<AcademicCalendarComponent['openDropdown']>, event: Event): void {
    event.stopPropagation();
    if (this.openDropdown === name) {
      this.openDropdown = null;
      return;
    }
    this.dropdownWidth = (event.currentTarget as HTMLElement).getBoundingClientRect().width;
    this.openDropdown = name;
  }

  handleDropdownKeydown(name: NonNullable<AcademicCalendarComponent['openDropdown']>, event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.openDropdown = null;
      return;
    }
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.openDropdown === name) {
        this.openDropdown = null;
      } else {
        this.dropdownWidth = (event.currentTarget as HTMLElement).getBoundingClientRect().width;
        this.openDropdown = name;
      }
    }
  }

  selectMonth(field: 'academicYearStartMonth' | 'academicYearEndMonth', value: number): void {
    this.calendar[field] = value;
    this.openDropdown = null;
  }

  selectTermsPerYear(value: 2 | 3 | 4): void {
    const event = { target: { value: String(value) } } as unknown as Event;
    this.openDropdown = null;
    void this.changeTermsPerYear(event);
  }

  selectNamingStyle(value: AcademicCalendarRequest['namingStyle']): void {
    this.calendar.namingStyle = value;
    this.openDropdown = null;
  }

  monthLabel(value: number): string {
    return this.months.find(month => month.value === value)?.label ?? '';
  }

  backToList(): void {
    this.screen = 'list';
    this.resetFormState();
  }

  saveCalendar(form: NgForm): void {
    this.attemptedSubmit = true;
    this.formErrorMessage = '';
    form.control.markAllAsTouched();

    if (form.invalid || this.getValidationErrors().length > 0 || this.isSaving || this.isLoadingCalendar || this.isLoadingReusableConfiguration) return;
    if (!this.universityId) {
      this.formErrorMessage = 'No University is associated with the current account.';
      return;
    }

    this.calendar.universityId = this.universityId;
    this.calendar.terms.forEach((term, index) => term.termSequence = index + 1);
    this.isSaving = true;

    const onSuccess = (response: ApiResponse<number | boolean>): void => {
      this.isSaving = false;
      if (!response.success) {
        this.formErrorMessage = response.message || 'Unable to save the academic calendar.';
        this.notification.warning(this.formErrorMessage);
        return;
      }

      this.notification.success(this.editingCalendarId ? 'Academic calendar updated successfully.' : 'Academic calendar created successfully.');
      this.screen = 'list';
      this.loadCalendars();
    };
    const onError = (error: unknown): void => {
      this.isSaving = false;
      const apiError = error as { error?: { message?: string; Message?: string } };
      this.formErrorMessage = apiError?.error?.message ?? apiError?.error?.Message ?? 'Unable to save the academic calendar.';
      this.notification.handleBusinessError(error, 'Failed to save academic calendar.');
    };

    if (this.editingCalendarId) {
      this.calendarService.updateCalendar(this.editingCalendarId, this.calendar).subscribe({ next: onSuccess, error: onError });
    } else {
      this.calendarService.createCalendar(this.calendar).subscribe({ next: onSuccess, error: onError });
    }
  }

  getValidationErrors(): string[] {
    const errors: string[] = this.getAcademicYearValidationErrors();
    if (this.calendar.terms.length !== this.calendar.termsPerYear) errors.push('The number of terms must match terms per year.');

    this.calendar.terms.forEach((term, index) => {
      const label = `Term ${index + 1}`;
      if (!term.termName.trim()) errors.push(`${label} name is required.`);
      if (term.termName.trim().length > 100) errors.push(`${label} name cannot exceed 100 characters.`);
    });

    return errors;
  }

  getAcademicYearValidationErrors(): string[] {
    const errors: string[] = [];
    if (!this.calendar.academicYearName.trim()) errors.push('Academic year name is required.');
    if (this.calendar.academicYearName.trim().length > 40) errors.push('Academic year name cannot exceed 40 characters.');
    if (!this.calendar.periodStartDate || !this.calendar.periodEndDate) errors.push('Enter both academic period dates.');
    if (this.calendar.periodStartDate && this.calendar.periodEndDate && this.calendar.periodStartDate > this.calendar.periodEndDate) {
      errors.push('Academic period start date must be on or before its end date.');
    }
    if (this.calendar.periodStartDate && Number(this.calendar.periodStartDate.slice(5, 7)) !== this.calendar.academicYearStartMonth) {
      errors.push('Academic period start date month must match the configured academic year start month.');
    }
    if (this.calendar.periodEndDate && Number(this.calendar.periodEndDate.slice(5, 7)) !== this.calendar.academicYearEndMonth) {
      errors.push('Academic period end date month must match the configured academic year end month.');
    }
    return errors;
  }

  close(): void {
    this.dialogRef.close();
  }

  private createEmptyCalendar(): AcademicCalendarRequest {
    const model = new AcademicCalendarRequest();
    model.terms = [1, 2].map(sequence => {
      const term = new AcademicTermRequest();
      term.termSequence = sequence;
      return term;
    });
    return model;
  }

  private generateNextAcademicYearName(sourceName: string, nextPeriodStartDate: string, nextPeriodEndDate: string): string {
    const nextStartYear = nextPeriodStartDate.slice(0, 4);
    const nextEndYear = nextPeriodEndDate.slice(0, 4);
    const yearRange = /\d{4}(\s*[-/–]\s*)\d{4}/;
    const matchedRange = sourceName.match(yearRange);
    return matchedRange
      ? sourceName.replace(yearRange, `${nextStartYear}${matchedRange[1]}${nextEndYear}`)
      : `${nextStartYear}-${nextEndYear}`;
  }

  private advanceDateByOneCalendarYear(value: string): string | null {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
    if (!dateMatch) return null;

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const maxSourceDay = this.daysInMonth(year, month);
    if (!maxSourceDay || day < 1 || day > maxSourceDay) return null;

    const nextYear = year + 1;
    const nextDay = Math.min(day, this.daysInMonth(nextYear, month));
    return `${nextYear.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${nextDay.toString().padStart(2, '0')}`;
  }

  private daysInMonth(year: number, month: number): number {
    if (month < 1 || month > 12) return 0;
    if (month === 2) {
      const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      return isLeapYear ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  }

  private copyTerm(term: AcademicTermRequest): AcademicTermRequest {
    const copy = new AcademicTermRequest();
    copy.termSequence = term.termSequence;
    copy.termName = term.termName;
    return copy;
  }

  private resetFormState(): void {
    this.attemptedSubmit = false;
    this.formErrorMessage = '';
    this.isLoadingCalendar = false;
    this.calendarLoadFailed = false;
  }

  private syncUniversityContext(): void {
    const profile = this.currentUserProfileService.getCurrentUserProfile();
    this.universityId = profile?.universityIds?.[0] ?? null;
  }

  private loadReusableConfiguration(): void {
    if (!this.universityId) {
      return;
    }

    const requestedUniversityId = this.universityId;
    this.isLoadingReusableConfiguration = true;
    this.calendarService.getCalendarsByUniversity(requestedUniversityId).subscribe({
      next: response => {
        if (this.universityId !== requestedUniversityId) return;
        const latest = response.success && response.result
          ? response.result
            .filter(item => item.universityId === requestedUniversityId)
            .sort((a, b) => b.periodStartDate.localeCompare(a.periodStartDate))[0]
          : undefined;
        if (!latest) {
          this.isLoadingReusableConfiguration = false;
          if (!response.success) this.notification.warning(response.message || 'Unable to load academic calendar defaults.');
          return;
        }

        this.calendarService.getCalendarById(latest.academicCalendarId).subscribe({
          next: detail => {
            this.isLoadingReusableConfiguration = false;
            if (!detail.success || !detail.result || this.universityId !== requestedUniversityId) {
              this.notification.warning(detail.message || 'Unable to load reusable academic calendar settings.');
              return;
            }

            const source = detail.result;
            const nextStart = this.advanceDateByOneCalendarYear(source.periodStartDate);
            const nextEnd = this.advanceDateByOneCalendarYear(source.periodEndDate);
            if (!nextStart || !nextEnd || source.terms.length !== source.termsPerYear) {
              this.notification.warning('The latest academic calendar does not contain valid reusable settings.');
              return;
            }

            this.calendar.academicYearName = this.generateNextAcademicYearName(source.academicYearName, nextStart, nextEnd);
            this.calendar.periodStartDate = nextStart;
            this.calendar.periodEndDate = nextEnd;
            this.calendar.academicYearStartMonth = source.academicYearStartMonth;
            this.calendar.academicYearEndMonth = source.academicYearEndMonth;
            this.calendar.termsPerYear = source.termsPerYear;
            this.calendar.namingStyle = this.isNamingStyle(source.namingStyle) ? source.namingStyle : 'Term';
            this.calendar.terms = source.terms
              .slice()
              .sort((a, b) => a.termSequence - b.termSequence)
              .map(term => this.copyTerm(term));
          },
          error: error => {
            this.isLoadingReusableConfiguration = false;
            this.notification.handleBusinessError(error, 'Failed to load reusable academic calendar settings.');
          }
        });
      },
      error: error => {
        if (this.universityId !== requestedUniversityId) return;
        this.isLoadingReusableConfiguration = false;
        this.notification.handleBusinessError(error, 'Failed to load reusable academic calendar settings.');
      }
    });
  }

  private isNamingStyle(value: string): value is AcademicCalendarRequest['namingStyle'] {
    return this.namingStyles.includes(value);
  }
}
