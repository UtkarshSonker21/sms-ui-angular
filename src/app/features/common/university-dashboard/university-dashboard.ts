import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface DashboardStat {
  title: string;
  value: string;
  subtext: string;
  type: 'success' | 'info' | 'primary' | 'warning';
  icon: string;
  subtextClass?: string;
}

export interface RecentApplication {
  avatar: string;
  studentName: string;
  studentId: string;
  programName: string;
  faculty: string;
  status: 'Acceptance in process' | 'Acceptance accepted' | 'Awarded' | 'Acceptance rejected';
  statusClass: string;
  time: string;
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
  welcomeMessage = 'Welcome back — Simad University';
  subtitleMessage = 'Fall 2025/2026 · Registration closes in 14 days';

  dashboardStats: DashboardStat[] = [];
  recentApplications: RecentApplication[] = [];
  upcomingDeadlines: UpcomingDeadline[] = [];

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentApplications();
    this.loadUpcomingDeadlines();
  }

  loadStats(): void {
    this.dashboardStats = [
      {
        title: 'SPONSORED STUDENTS',
        value: '120',
        subtext: '↑ 8 this month',
        type: 'success',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
      },
      {
        title: 'APPLICATIONS UNDER REVIEW',
        value: '24',
        subtext: '12 need decision',
        type: 'info',
        icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H9H8',
        subtextClass: 'muted'
      },
      {
        title: 'REGISTERED STUDENTS',
        value: '85',
        subtext: '69% of eligible',
        type: 'primary',
        icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
        subtextClass: 'muted'
      },
      {
        title: 'OUTSTANDING PAYMENTS',
        value: '8,400',
        subtext: 'SOS · uncollected',
        type: 'warning',
        icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
        subtextClass: 'neg'
      }
    ];
  }

  loadRecentApplications(): void {
    this.recentApplications = [
      {
        avatar: 'A1',
        studentName: 'Student A',
        studentId: 'ID: 2024-0647',
        programName: 'General Medicine',
        faculty: 'Faculty of Medicine',
        status: 'Acceptance in process',
        statusClass: 'chip-pending',
        time: '2 hours ago'
      },
      {
        avatar: 'B2',
        studentName: 'Student B',
        studentId: 'ID: 2024-0823',
        programName: 'Mechanical Engineering',
        faculty: 'Faculty of Engineering',
        status: 'Acceptance accepted',
        statusClass: 'chip-accepted',
        time: '5 hours ago'
      },
      {
        avatar: 'C3',
        studentName: 'Student C',
        studentId: 'ID: 2024-0901',
        programName: 'Pharmacy',
        faculty: 'Faculty of Pharmacy',
        status: 'Awarded',
        statusClass: 'chip-awarded',
        time: 'Yesterday'
      },
      {
        avatar: 'D4',
        studentName: 'Student D',
        studentId: 'ID: 2024-0765',
        programName: 'Accounting',
        faculty: 'Faculty of Business',
        status: 'Acceptance rejected',
        statusClass: 'chip-rejected',
        time: '2 days ago'
      }
    ];
  }

  loadUpcomingDeadlines(): void {
    this.upcomingDeadlines = [
      {
        month: 'NOV',
        date: '14',
        title: 'Registration closes',
        subtitle: 'Semester 1 — all programs',
        type: 'info'
      },
      {
        month: 'NOV',
        date: '22',
        title: 'Submit prior semester results',
        subtitle: 'Spring 2024/2025 grades',
        type: 'warning'
      },
      {
        month: 'DEC',
        date: '03',
        title: 'Payment report to Direct Aid',
        subtitle: 'Q4 reconciliation',
        type: 'danger'
      }
    ];
  }
}
