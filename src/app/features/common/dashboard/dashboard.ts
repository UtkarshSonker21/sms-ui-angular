import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterSchoolFilter } from '../../../core/models/school/master-school/master-school-filter.model';

import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';

import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramFilter } from '../../../core/models/university/programs/program-filter.model';

import { StaffService } from '../../../core/services/superadmin/staff.service';
import { StaffFilterModel } from '../../../core/models/super-admin/staff/staff-filter.model';
import { StaffRequestModel } from '../../../core/models/super-admin/staff/staff-request.model';
import { StaffType } from '../../../core/enums/staff-type.enum';

export interface DashboardKpiCard {
  title: string;
  value: string;
  type: 'success' | 'info' | 'primary' | 'warning' | 'danger';
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  isLoading = false;
  hasError = false;

  totalPrograms = 0;
  totalUniversities = 0;
  totalSchools = 0;

  kpiCards: DashboardKpiCard[] = [];
  topStaffList: StaffRequestModel[] = [];

  private readonly programService = inject(ProgramService);
  private readonly universityService = inject(MasterUniversityService);
  private readonly schoolService = inject(MasterSchoolService);
  private readonly staffService = inject(StaffService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.initKpiCards();

    // Set filters with minimum page size (1) to get totalCount from headers/body response
    const programFilter = new ProgramFilter();
    programFilter.pageNumber = 1;
    programFilter.pageSize = 1;

    const uniFilter = new MasterUniversityFilter();
    uniFilter.pageNumber = 1;
    uniFilter.pageSize = 1;

    const schoolFilter = new MasterSchoolFilter();
    schoolFilter.pageNumber = 1;
    schoolFilter.pageSize = 1;

    const staffFilter = new StaffFilterModel();
    staffFilter.pageNumber = 1;
    staffFilter.pageSize = 5; // Load top 5 staff members

    forkJoin({
      programs: this.programService.getPrograms(programFilter),
      universities: this.universityService.getMasterUniversities(uniFilter),
      schools: this.schoolService.getMasterSchools(schoolFilter),
      staff: this.staffService.getStaffs(staffFilter)
    }).subscribe({
      next: (responses) => {
        // Total Programs count
        if (responses.programs?.success && responses.programs.result) {
          this.totalPrograms = responses.programs.result.totalCount || 0;
        }

        // Total Universities count
        if (responses.universities?.success && responses.universities.result) {
          this.totalUniversities = responses.universities.result.totalCount || 0;
        }

        // Total Schools count
        if (responses.schools?.success && responses.schools.result) {
          this.totalSchools = responses.schools.result.totalCount || 0;
        }

        // Top Staff list
        if (responses.staff?.success && responses.staff.result) {
          this.topStaffList = responses.staff.result.items || [];
        }

        this.initKpiCards();
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.initKpiCards();
      }
    });
  }

  initKpiCards(): void {
    this.kpiCards = [
      {
        title: 'TOTAL PROGRAMS',
        value: this.totalPrograms.toString(),
        type: 'primary',
        icon: 'fas fa-graduation-cap'
      },
      {
        title: 'TOTAL UNIVERSITIES',
        value: this.totalUniversities.toString(),
        type: 'info',
        icon: 'fas fa-university'
      },
      {
        title: 'TOTAL SCHOOLS',
        value: this.totalSchools.toString(),
        type: 'warning',
        icon: 'fas fa-school'
      }
    ];
  }

  getStaffTypeDisplayName(type: StaffType | string): string {
    switch (type) {
      case StaffType.SuperAdmin:
        return 'Super Admin';
      case StaffType.Ngo:
        return 'NGO';
      case StaffType.School:
        return 'School';
      case StaffType.University:
        return 'University';
      case StaffType.Marketing:
        return 'Marketing';
      case StaffType.Finance:
        return 'Finance';
      default:
        return type || '-';
    }
  }

  navigateToStaffManagement(): void {
    this.router.navigate(['/staff']);
  }
}
