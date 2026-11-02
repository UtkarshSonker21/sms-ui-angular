import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';
import { MasterUniversityFilter } from '../../../core/models/university/master-university/university-registration-filter.model';

import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramFilter } from '../../../core/models/university/programs/program-filter.model';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterSchoolRequest } from '../../../core/models/school/master-school/master-school-request.model';
import { MasterSchoolFilter } from '../../../core/models/school/master-school/master-school-filter.model';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { FailingCoreCaseService } from '../../../core/services/ngo/failing-core-case.service';
import { StudentService } from '../../../core/services/school/student.service';
import { StudntFilter } from '../../../core/models/school/students/student-filter.model';

import { AccreditationStatus } from '../../../core/enums/accreditation-status.enum';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { AppRoutes } from '../../../core/constants/app-routes';

type DashboardKpiKey = 'accreditedUniversities' | 'pendingPrograms' | 'failingCoreCases' | 'sponsoredStudents';

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
  schoolAccreditationRequests: MasterSchoolRequest[] = [];

  totalPendingPrograms: number | null = null;
  totalPendingUniversities: number = 0;
  accreditedUniversitiesCount: number | null = null;
  failingCoreCasesCount: number | null = null;
  sponsoredStudentsCount: number | null = null;

  private readonly programService = inject(ProgramService);
  private readonly uniService = inject(MasterUniversityService);
  private readonly schoolService = inject(MasterSchoolService);
  private readonly countryService = inject(MasterCountryService);
  private readonly failingCoreCaseService = inject(FailingCoreCaseService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);

  private readonly schoolCountryNames = new Map<number, string>();
  private readonly unavailableKpis = new Set<DashboardKpiKey>();

  ngOnInit(): void {
    this.initSummaryCards();
    this.loadPendingPrograms();
    this.loadPendingUniversities();
    this.loadPendingSchools();
    this.loadAccreditedUniversitiesCount();
    this.loadFailingCoreCasesCount();
    this.loadSponsoredStudentsCount();
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
          this.totalPendingPrograms = this.readTotalCount(res.result.totalCount);
        } else {
          this.pendingAccreditations = [];
          this.totalPendingPrograms = null;
        }
        this.updateKpiAvailability('pendingPrograms', this.totalPendingPrograms);
      },
      error: () => {
        this.pendingAccreditations = [];
        this.totalPendingPrograms = null;
        this.updateKpiAvailability('pendingPrograms', null);
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

  loadPendingSchools(): void {
    const countryFilter = new MasterCountryFilter();
    countryFilter.pageNumber = 1;
    countryFilter.pageSize = 1000;

    this.countryService.getMasterCountries(countryFilter).subscribe({
      next: (res) => {
        this.schoolCountryNames.clear();
        if (res?.success && res.result) {
          res.result.items.forEach(country => {
            if (country.countryId) {
              this.schoolCountryNames.set(country.countryId, country.countryName);
            }
          });
        }
        this.loadPendingSchoolRequests();
      },
      error: () => this.loadPendingSchoolRequests()
    });
  }

  private loadPendingSchoolRequests(): void {
    const filter = new MasterSchoolFilter();
    filter.pageNumber = 1;
    filter.pageSize = 5;
    filter.accreditationStatus = AccreditationStatus.Pending;

    this.schoolService.getMasterSchools(filter).subscribe({
      next: (res) => {
        this.schoolAccreditationRequests = res?.success && res.result
          ? res.result.items || []
          : [];
      },
      error: () => {
        this.schoolAccreditationRequests = [];
      }
    });
  }

  getSchoolCountryName(countryId?: number): string {
    return countryId ? this.schoolCountryNames.get(countryId) || '-' : '-';
  }

  loadAccreditedUniversitiesCount(): void {
    const filter = new MasterUniversityFilter();
    filter.pageNumber = 1;
    filter.pageSize = 1;
    filter.accreditationStatus = AccreditationStatus.Accredited;

    this.uniService.getMasterUniversities(filter).subscribe({
      next: (res) => {
        this.accreditedUniversitiesCount = res?.success && res.result
          ? this.readTotalCount(res.result.totalCount)
          : null;
        this.updateKpiAvailability('accreditedUniversities', this.accreditedUniversitiesCount);
      },
      error: () => {
        this.accreditedUniversitiesCount = null;
        this.updateKpiAvailability('accreditedUniversities', null);
      }
    });
  }

  loadFailingCoreCasesCount(): void {
    this.failingCoreCaseService.getAll().subscribe({
      next: (res) => {
        this.failingCoreCasesCount = res?.success && Array.isArray(res.result)
          ? res.result.filter(item => item.status === 'Pending').length
          : null;
        this.updateKpiAvailability('failingCoreCases', this.failingCoreCasesCount);
      },
      error: () => {
        this.failingCoreCasesCount = null;
        this.updateKpiAvailability('failingCoreCases', null);
      }
    });
  }

  loadSponsoredStudentsCount(): void {
    const filter = new StudntFilter();
    filter.pageNumber = 1;
    filter.pageSize = 1;
    filter.studentStatusId = StudentStatusEnum.Sponsored;

    this.studentService.getStudents(filter).subscribe({
      next: (res) => {
        this.sponsoredStudentsCount = res?.success && res.result
          ? this.readTotalCount(res.result.totalCount)
          : null;
        this.updateKpiAvailability('sponsoredStudents', this.sponsoredStudentsCount);
      },
      error: () => {
        this.sponsoredStudentsCount = null;
        this.updateKpiAvailability('sponsoredStudents', null);
      }
    });
  }

  private readTotalCount(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  }

  private updateKpiAvailability(key: DashboardKpiKey, value: number | null): void {
    if (value === null) {
      this.unavailableKpis.add(key);
    } else {
      this.unavailableKpis.delete(key);
    }
    this.initSummaryCards();
  }

  initSummaryCards(): void {
    const valueText = (value: number | null): string => value === null ? '—' : value.toLocaleString();
    const subtext = (key: DashboardKpiKey, value: number | null, loadedText: string): string =>
      value === null ? (this.unavailableKpis.has(key) ? 'Unavailable' : 'Loading…') : loadedText;

    this.summaryCards = [
      {
        title: 'Accredited Universities',
        value: valueText(this.accreditedUniversitiesCount),
        subtext: subtext('accreditedUniversities', this.accreditedUniversitiesCount, 'Accredited by the committee'),
        type: 'success',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
      },
      {
        title: 'Programs Pending Review',
        value: valueText(this.totalPendingPrograms),
        subtext: subtext('pendingPrograms', this.totalPendingPrograms, 'Awaiting committee decision'),
        type: 'warning',
        icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
      },
      {
        title: 'Failing-Core Cases',
        value: valueText(this.failingCoreCasesCount),
        subtext: subtext('failingCoreCases', this.failingCoreCasesCount, 'Awaiting committee approval'),
        type: 'danger',
        icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
      },
      {
        title: 'Total Sponsored Students',
        value: valueText(this.sponsoredStudentsCount),
        subtext: subtext('sponsoredStudents', this.sponsoredStudentsCount, 'Currently sponsored students'),
        type: 'info',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
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

  reviewSchool(schoolId?: number): void {
    if (schoolId) {
      this.router.navigate(['/', AppRoutes.Ngo.SchoolAccreditationDetail, schoolId]);
    }
  }

  viewAllSchools(): void {
    this.router.navigate(['/', AppRoutes.Ngo.SchoolAccreditation]);
  }
}
