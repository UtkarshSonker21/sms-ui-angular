import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { StudentService } from '../../../core/services/school/student.service';
import { Router } from '@angular/router';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { StudntFilter } from '../../../core/models/school/students/student-filter.model';
import { AppRoutes } from '../../../core/constants/app-routes';
import { HelperMethods } from '../../../core/helpers/helper-methods';
export interface DashboardStat {
  title: string;
  value: string;
  subtext: string;
  type: 'success' | 'info' | 'primary' | 'warning' | 'danger';
  icon: string;
  subtextClass?: string;
}

export interface JourneyStage {
  name: string;
  count: number;
}

export interface NomineeTracking {
  id: number;
  avatar: string;
  photoPath?: string;
  studentName: string;
  studentId: string;
  programName: string;
  universityName: string;
  status: string;
  statusClass: string;
  lastUpdated: string;
}

@Component({
  selector: 'app-school-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './school-dashboard.html',
  styleUrl: './school-dashboard.scss',
})
export class SchoolDashboard implements OnInit {
  welcomeMessage = 'Welcome — Al-Furqan Schools Coordinator';

  dashboardStats: DashboardStat[] = [];
  nominationJourney: JourneyStage[] = [];
  recentStudents: NomineeTracking[] = [];

  private currentUserProfileService = inject(CurrentUserProfileService);
  private studentService = inject(StudentService);
  private router = inject(Router);

  ngOnInit(): void {
    // current user
    const currentUser = this.currentUserProfileService.getCurrentUserProfile();
    if (currentUser) {
      this.welcomeMessage = `Welcome — ${currentUser.fullName}`;
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const filter = new StudntFilter();
    filter.pageNumber = 1;
    filter.pageSize = 1000;
    
    const currentUser = this.currentUserProfileService.getCurrentUserProfile();
    if (currentUser) {
      filter.createdBy = currentUser.loginId;
    }

    this.studentService.getStudents(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          const items = response.result.items;
          const totalRecords = response.result.totalCount;

          const inProcessCount = items.filter(s => s.studentApplicationStatusId === StudentStatusEnum.AcceptanceInProcess).length;
          const sponsoredCount = items.filter(s => s.studentApplicationStatusId === StudentStatusEnum.Sponsored).length;
          const registeredCount = items.filter(s => s.studentApplicationStatusId === StudentStatusEnum.Registered).length;
          const graduatedCount = items.filter(s => s.studentApplicationStatusId === StudentStatusEnum.Graduate).length;

          this.nominationJourney = [
            { name: 'Nominated', count: totalRecords },
            { name: 'Sponsored', count: sponsoredCount },
            { name: 'Registered', count: registeredCount },
            { name: 'Graduated', count: graduatedCount }
          ];

          this.dashboardStats = [
            {
              title: 'TOTAL STUDENTS',
              value: totalRecords.toString(),
              subtext: 'Created by you',
              type: 'primary',
              icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
            },
            {
              title: 'IN PROCESS',
              value: inProcessCount.toString(),
              subtext: 'Acceptance In Process',
              type: 'warning',
              icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
            },
            {
              title: 'SPONSORED',
              value: sponsoredCount.toString(),
              subtext: 'Approved sponsorships',
              type: 'success',
              icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'
            },
            {
              title: 'REGISTERED',
              value: registeredCount.toString(),
              subtext: 'Finalized registrations',
              type: 'success',
              icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H9H8'
            }
          ];

          const recentItems = items.slice(0, 5);
          this.recentStudents = recentItems.map(s => {
            return {
              id: s.studentId!,
              avatar: s.fullName ? s.fullName.substring(0, 2).toUpperCase() : 'ST',
              photoPath: s.photoPath,
              studentName: s.fullName || 'Unknown',
              studentId: s.studentCode || 'N/A',
              programName: s.studentAssignedProgramName || 'Not Assigned',
              universityName: s.studentAssignedUniversityName || 'Not Assigned',
              status: this.getStatusName(s.studentApplicationStatusId),
              statusClass: this.getStatusBadgeClass(s.studentApplicationStatusId),
              lastUpdated: s.formattedUpdatedDate || s.formattedCreatedDate || 'Recently'
            };
          });
        }
      }
    });
  }

  getStatusBadgeClass(statusId?: number): string {
    switch(statusId) {
      case StudentStatusEnum.Draft: return 'chip-draft';
      case StudentStatusEnum.AcceptanceInProcess: return 'chip-acceptance-process';
      case StudentStatusEnum.AcceptanceRejected: return 'chip-acceptance-rejected';
      case StudentStatusEnum.Sponsored: return 'chip-sponsored';
      case StudentStatusEnum.SponsoredRejected: return 'chip-sponsored-rejected';
      case StudentStatusEnum.Awarded: return 'chip-awarded';
      case StudentStatusEnum.AwardedRejected: return 'chip-awarded-rejected';
      case StudentStatusEnum.Registered: return 'chip-registered';
      case StudentStatusEnum.Failed: return 'chip-failed';
      case StudentStatusEnum.Dismissed: return 'chip-dismissed';
      case StudentStatusEnum.Graduate: return 'chip-graduate';
      default: return 'chip-draft';
    }
  }

  getStatusName(statusId?: number): string {
    switch(statusId) {
      case StudentStatusEnum.Draft: return 'Draft';
      case StudentStatusEnum.AcceptanceInProcess: return 'Acceptance In Process';
      case StudentStatusEnum.AcceptanceRejected: return 'Acceptance Rejected';
      case StudentStatusEnum.Sponsored: return 'Sponsored';
      case StudentStatusEnum.SponsoredRejected: return 'Sponsored Rejected';
      case StudentStatusEnum.Awarded: return 'Awarded';
      case StudentStatusEnum.AwardedRejected: return 'Awarded Rejected';
      case StudentStatusEnum.Registered: return 'Registered';
      case StudentStatusEnum.Failed: return 'Failed';
      case StudentStatusEnum.Dismissed: return 'Dismissed';
      case StudentStatusEnum.Graduate: return 'Graduate';
      default: return 'Not Assigned';
    }
  }

  photoErrors = new Set<number>();

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  handlePhotoError(studentId: number): void {
    if (studentId) {
      this.photoErrors.add(studentId);
    }
  }

  hasPhotoError(studentId: number): boolean {
    return this.photoErrors.has(studentId);
  }

  exportData(): void {
    alert('Export feature coming soon.');
  }

  viewStudent(id: number): void {
    this.router.navigate([AppRoutes.School.CoordinatorEditStudent, id]);
  }

  
}
