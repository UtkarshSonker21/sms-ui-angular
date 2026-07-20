import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  avatar: string;
  studentName: string;
  studentId: string;
  programName: string;
  universityName: string;
  status: 'Acceptance in Process' | 'Acceptance Rejected' | 'Sponsored' | 'Sponsored Rejected' | 'Registered';
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

  ngOnInit(): void {
    this.loadStats();
    this.loadNominationJourney();
    this.loadRecentStudents();
  }

  loadStats(): void {
    this.dashboardStats = [
      {
        title: 'NOMINEES THIS YEAR',
        value: '28',
        subtext: 'Of 30 allocated slots',
        type: 'primary',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
      },
      {
        title: 'DOCUMENTS REJECTED',
        value: '18',
        subtext: '64% of nominations',
        type: 'danger',
        icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H9H8',
        subtextClass: 'neg'
      },
      {
        title: 'SPONSORED',
        value: '14',
        subtext: '50% success rate',
        type: 'success',
        icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
      },
      {
        title: 'ACCEPTANCE IN PROCESS',
        value: '4',
        subtext: 'With universities',
        type: 'warning',
        icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      }
    ];
  }

  loadNominationJourney(): void {
    this.nominationJourney = [
      { name: 'Nominated', count: 28 },
      { name: 'Sponsored', count: 14 },
      { name: 'Registered', count: 9 },
      { name: 'Graduated', count: 4 }
    ];
  }

  loadRecentStudents(): void {
    this.recentStudents = [
      {
        avatar: 'A1',
        studentName: 'Ahmed Omar',
        studentId: 'ID: 2024-001',
        programName: 'Computer Science',
        universityName: 'Simad University',
        status: 'Acceptance in Process',
        statusClass: 'chip-pending',
        lastUpdated: '2 hours ago'
      },
      {
        avatar: 'B2',
        studentName: 'Aisha Jama',
        studentId: 'ID: 2024-002',
        programName: 'Public Health',
        universityName: 'Mogadishu University',
        status: 'Sponsored',
        statusClass: 'chip-accepted',
        lastUpdated: '5 hours ago'
      },
      {
        avatar: 'C3',
        studentName: 'Mohamed Ali',
        studentId: 'ID: 2024-003',
        programName: 'Civil Engineering',
        universityName: 'Jamhuriya University',
        status: 'Registered',
        statusClass: 'chip-success',
        lastUpdated: '1 day ago'
      },
      {
        avatar: 'D4',
        studentName: 'Fatima Hassan',
        studentId: 'ID: 2024-004',
        programName: 'Business Admin',
        universityName: 'City University',
        status: 'Sponsored Rejected',
        statusClass: 'chip-rejected',
        lastUpdated: '2 days ago'
      },
      {
        avatar: 'E5',
        studentName: 'Hassan Abdi',
        studentId: 'ID: 2024-005',
        programName: 'Information Technology',
        universityName: 'Simad University',
        status: 'Acceptance Rejected',
        statusClass: 'chip-danger',
        lastUpdated: '3 days ago'
      }
    ];
  }

  exportData(): void {
    alert('Export feature coming soon.');
  }
}
