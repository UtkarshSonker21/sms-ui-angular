import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';

import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramFilter } from '../../../core/models/university/programs/program-filter.model';

import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { AppRoutes } from '../../../core/constants/app-routes';

export interface DashboardStat {
  title: string;
  value: string;
  subtext: string;
  type: 'success' | 'info' | 'primary' | 'warning' | 'danger';
  icon: string;
  subtextClass?: string;
}

@Component({
  selector: 'app-ngo-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ngo-dashboard.html',
  styleUrl: './ngo-dashboard.scss',
})
export class NgoDashboard implements OnInit {
  welcomeMessage = 'Welcome — NGO Portal';
  
  summaryCards: DashboardStat[] = [];
  
  pendingAccreditations: ProgramRequest[] = [];
  universityRequests: MasterUniversityRequest[] = [];

  totalPendingPrograms: number = 0;
  totalPendingUniversities: number = 0;

  private readonly programService = inject(ProgramService);
  private readonly uniService = inject(MasterUniversityService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.initSummaryCards();
    this.loadPendingPrograms();
    this.loadPendingUniversities();
  }

  loadPendingPrograms(): void {
    const filter = new ProgramFilter();
    filter.pageNumber = 1;
    filter.pageSize = 5;
    filter.accreditationStatus = AccreditationStatus.Pending;

    this.programService.getPrograms(filter).subscribe({
      next: (res) => {
        if (res?.success && res.result) {
          this.pendingAccreditations = res.result.items || [];
          this.totalPendingPrograms = res.result.totalCount || 0;
          this.initSummaryCards();
        }
      }
    });
  }

  loadPendingUniversities(): void {
    const filter = new MasterUniversityFilter();
    filter.pageNumber = 1;
    filter.pageSize = 5;
    filter.accreditationStatus = AccreditationStatus.Pending;

    this.uniService.getMasterUniversities(filter).subscribe({
      next: (res) => {
        if (res?.success && res.result) {
          this.universityRequests = res.result.items || [];
          this.totalPendingUniversities = res.result.totalCount || 0;
          this.initSummaryCards();
        }
      }
    });
  }

  initSummaryCards(): void {
    this.summaryCards = [
      {
        title: 'PENDING PROGRAMS',
        value: this.totalPendingPrograms.toString(),
        subtext: 'Awaiting review',
        type: 'primary',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
      },
      {
        title: 'PENDING UNIVERSITIES',
        value: this.totalPendingUniversities.toString(),
        subtext: 'Awaiting review',
        type: 'info',
        icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
        subtextClass: 'muted'
      },
      {
        title: 'TOTAL REVIEWS',
        value: (this.totalPendingPrograms + this.totalPendingUniversities).toString(),
        subtext: 'Requires attention',
        type: 'warning',
        icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H9H8',
        subtextClass: 'neg'
      },
      {
        title: 'SYSTEM ALERTS',
        value: '0',
        subtext: 'All operational',
        type: 'success',
        icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      }
    ];
  }

  reviewProgram(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/', AppRoutes.Ngo.ProgramAccreditationDetail, id]);
    }
  }

  viewAllPrograms(): void {
    this.router.navigate(['/', AppRoutes.Ngo.ProgramAccreditation]);
  }

  reviewUniversity(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/', AppRoutes.Ngo.UniversityAccreditationDetail, id]);
    }
  }

  viewAllUniversities(): void {
    this.router.navigate(['/', AppRoutes.Ngo.UniversityAccreditation]);
  }
}
