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

export interface DashboardStat {
  title: string;
  value: string;
  subtext: string;
  type: 'success' | 'info' | 'primary' | 'warning';
  icon: string;
  subtextClass?: string;
}

export interface UpcomingDeadline {
  month: string;
  date: string;
  title: string;
  subtitle: string;
  type: 'danger' | 'warning' | 'info';
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

  dashboardStats: DashboardStat[] = [];
  recentApplications: StudentProgramApplication[] = [];
  upcomingDeadlines: UpcomingDeadline[] = [];

  isLoading = true;

  private studentService = inject(StudentProgramService);
  private studentStatusService = inject(StudentStatusService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private currentUserProfileService = inject(CurrentUserProfileService);

  ngOnInit(): void {
    const profile = this.currentUserProfileService.getCurrentUserProfile();
    const name = profile.fullName || 'User';
    this.welcomeMessage = `Welcome — ${name}`;

    this.loadData();
    this.loadUpcomingDeadlines();
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
    const total = totalRecords;
    const inProcess = items.filter(s => s.applicationStatusName?.toLowerCase().includes('in process')).length;
    const sponsored = items.filter(s => s.applicationStatusName === 'Sponsored').length;
    const registered = items.filter(s => s.applicationStatusName === 'Registered').length;

    this.dashboardStats = [
      {
        title: 'TOTAL STUDENTS',
        value: total.toString(),
        subtext: 'All applications',
        type: 'primary',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
      },
      {
        title: 'IN PROCESS',
        value: inProcess.toString(),
        subtext: 'Acceptance pending',
        type: 'info',
        icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H9H8',
        subtextClass: 'muted'
      },
      {
        title: 'SPONSORED',
        value: sponsored.toString(),
        subtext: 'Approved sponsorships',
        type: 'success',
        icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
        subtextClass: 'muted'
      },
      {
        title: 'REGISTERED',
        value: registered.toString(),
        subtext: 'Fully registered',
        type: 'warning',
        icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
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
      { title: 'TOTAL STUDENTS', value: '0', subtext: 'All applications', type: 'primary', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
      { title: 'IN PROCESS', value: '0', subtext: 'Acceptance pending', type: 'info', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H9H8', subtextClass: 'muted' },
      { title: 'SPONSORED', value: '0', subtext: 'Approved sponsorships', type: 'success', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', subtextClass: 'muted' },
      { title: 'REGISTERED', value: '0', subtext: 'Fully registered', type: 'warning', icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', subtextClass: 'neg' }
    ];
  }

  loadUpcomingDeadlines(): void {
    this.upcomingDeadlines = [];
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

  viewStudent(studentId: number): void {
    const student = this.recentApplications.find(x => x.studentId === studentId);
    if (student) {
      this.router.navigate(['/university-student-details', student.applicationId]);
    }
  }
}
