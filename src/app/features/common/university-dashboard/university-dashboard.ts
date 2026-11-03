import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentProgramApplicationFilter } from '../../../core/models/school/student-program-application/student-program-application-filter.model';
import { StudentProgramApplication } from '../../../core/models/school/student-program-application/student-program-application.model';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { NotificationService } from '../../../core/services/common/notification.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { MatDialog } from '@angular/material/dialog';
import { StaffType } from '../../../core/enums/staff-type.enum';
import { AcademicCalendarComponent } from '../../university/academic-calendar/academic-calendar';

export interface DashboardStat {
  title: string;
  value: string;
  subtext: string;
  type: 'success' | 'info' | 'primary' | 'warning';
  icon: string;
  subtextClass?: string;
}

export interface DashboardDeadline {
  id: number;
  title: string;
  date: string;
  description: string;
  badgeStyle: 'success' | 'warning' | 'neutral';
}

@Component({
  selector: 'app-university-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './university-dashboard.html',
  styleUrl: './university-dashboard.scss',
})
export class UniversityDashboard implements OnInit {
  welcomeMessage = '';
  subtitleMessage = 'Fall 2025/2026 · Registration closes in 14 days';

  dashboardStats: DashboardStat[] = this.getEmptyStats();
  recentApplications: StudentProgramApplication[] = [];
  upcomingDeadlines: DashboardDeadline[] = [
    {
      id: 1,
      title: 'Registration closes',
      date: '2026-11-14',
      description: 'Semester 1 — all programs',
      badgeStyle: 'success'
    },
    {
      id: 2,
      title: 'Submit prior semester results',
      date: '2026-11-22',
      description: 'Spring 2024/2025 grades',
      badgeStyle: 'warning'
    },
    {
      id: 3,
      title: 'Payment report to Direct Aid',
      date: '2026-12-03',
      description: 'Q4 reconciliation',
      badgeStyle: 'neutral'
    }
  ];

  isLoading = true;

  private studentService = inject(StudentProgramService);
  private studentStatusService = inject(StudentStatusService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private dialog = inject(MatDialog);

  get isUniversityUser(): boolean {
    return this.currentUserProfileService.getCurrentUserProfile()?.staffType === StaffType.University;
  }

  openAcademicCalendar(): void {
    this.dialog.open(AcademicCalendarComponent, {
      width: '1120px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      panelClass: 'academic-calendar-dialog-panel',
      autoFocus: true,
      restoreFocus: true,
      ariaLabel: 'Academic Calendar Configuration'
    });
  }

  ngOnInit(): void {
    const profile = this.currentUserProfileService.getCurrentUserProfile();
    const name = profile.fullName || 'User';
    this.welcomeMessage = `Welcome — ${name}`;

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    const filter = new StudentProgramApplicationFilter();
    filter.pageNumber = 1;
    filter.pageSize = 1000; // Large enough to calculate dashboard stats

    this.studentService.search(filter).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.result) {
          const items = response.result.items;
          const totalRecords = response.result.totalCount;
          this.calculateKPIs(items, totalRecords);
          this.processRecentApplications(items);
        } else {
          this.dashboardStats = this.getEmptyStats();
          this.recentApplications = [];
          this.notification.warning(response.message || 'Failed to load dashboard data');
        }
      },
      error: () => {
        this.isLoading = false;
        this.dashboardStats = this.getEmptyStats();
        this.recentApplications = [];
        this.notification.error('Failed to load dashboard data.');
      }
    });
  }

  calculateKPIs(items: StudentProgramApplication[], totalRecords: number): void {
    const sponsored = items.filter(s =>
      s.applicationStatusId === StudentStatusEnum.Sponsored ||
      s.applicationStatusName === 'Sponsored'
    ).length;

    const underReview = items.filter(s =>
      s.applicationStatusId === StudentStatusEnum.AcceptanceInProcess ||
      s.applicationStatusName?.toLowerCase().includes('in process')
    ).length;

    const registered = items.filter(s =>
      s.applicationStatusId === StudentStatusEnum.Registered ||
      s.applicationStatusName === 'Registered'
    ).length;

    this.dashboardStats = [
      {
        title: 'Sponsored Students',
        value: sponsored.toLocaleString(),
        subtext: '↑ 8 this month',
        type: 'success',
        icon: '',
        subtextClass: ''
      },
      {
        title: 'Applications Under Review',
        value: underReview.toLocaleString(),
        subtext: '12 need decision',
        type: 'info',
        icon: '',
        subtextClass: 'muted'
      },
      {
        title: 'Registered Students',
        value: registered.toLocaleString(),
        subtext: '69% of eligible',
        type: 'warning',
        icon: '',
        subtextClass: 'muted'
      },
      {
        title: 'Outstanding Payments',
        value: '8,400',
        subtext: 'SOS · uncollected',
        type: 'warning',
        icon: '',
        subtextClass: 'neg'
      }
    ];
  }

  processRecentApplications(items: StudentProgramApplication[]): void {
    const sorted = [...items].sort((a, b) => {
      const dateA = a.actionDate ? new Date(a.actionDate).getTime() : 0;
      const dateB = b.actionDate ? new Date(b.actionDate).getTime() : 0;
      return dateB - dateA;
    });
    this.recentApplications = sorted.slice(0, 5);
  }

  getEmptyStats(): DashboardStat[] {
    return [
      {
        title: 'Sponsored Students',
        value: '0',
        subtext: '↑ 8 this month',
        type: 'success',
        icon: '',
        subtextClass: ''
      },
      {
        title: 'Applications Under Review',
        value: '0',
        subtext: '12 need decision',
        type: 'info',
        icon: '',
        subtextClass: 'muted'
      },
      {
        title: 'Registered Students',
        value: '0',
        subtext: '69% of eligible',
        type: 'warning',
        icon: '',
        subtextClass: 'muted'
      },
      {
        title: 'Outstanding Payments',
        value: '8,400',
        subtext: 'SOS · uncollected',
        type: 'warning',
        icon: '',
        subtextClass: 'neg'
      }
    ];
  }

  getDeadlineMonth(date: string): string {
    const month = Number(date.slice(5, 7));
    return month >= 1 && month <= 12
      ? new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'short' }).toUpperCase()
      : '';
  }

  getDeadlineDay(date: string): string {
    return date.slice(8, 10);
  }

  getStatusBadgeClass(student: StudentProgramApplication): string {
    return this.studentStatusService.getBadgeClass(
      student.applicationStatusId ?? StudentStatusEnum.Draft
    );
  }

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  photoErrors = new Set<number>();
  handlePhotoError(studentId: number): void {
    if (studentId) {
      this.photoErrors.add(studentId);
    }
  }

  hasPhotoError(studentId: number): boolean {
    return this.photoErrors.has(studentId);
  }

  getInitials(name?: string): string {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0]?.charAt(0).toUpperCase() || '?';
  }

  viewStudent(studentId: number): void {
    const student = this.recentApplications.find(x => x.studentId === studentId);
    if (student) {
      if (student.applicationStatusId === StudentStatusEnum.Registered) {
        this.router.navigate(['/registered-student', student.applicationId]);
      } else {
        this.router.navigate(['/university-student-details', student.applicationId]);
      }
    }
  }
}
