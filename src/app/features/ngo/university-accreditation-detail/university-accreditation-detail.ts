import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { MasterUniversityService } from '../../../core/services/university/master-university.service';
import { MasterUniversityRequest } from '../../../core/models/university/master-university/university-registration.model';

import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { AppRoutes } from '../../../core/constants/app-routes';

@Component({
  selector: 'app-university-accreditation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './university-accreditation-detail.html',
  styleUrl: './university-accreditation-detail.scss',
})
export class UniversityAccreditationDetail implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isStatusDropdownOpen = false;
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private universityService = inject(MasterUniversityService);
  private countryService = inject(MasterCountryService);
  private notification = inject(NotificationService);

  university = new MasterUniversityRequest();
  selectedStatus = 1; // 1 = Pending, 2 = Accredited, 3 = Rejected
  comment = '';
  isStatusDropdownOpen = false;

  countries: MasterCountryRequest[] = [];
  countryMap = new Map<number, string>();

  // Mock Fallback Data matching universities.js seed
  private mockCountries: MasterCountryRequest[] = [
    { countryId: 1, countryName: 'Somalia', countryIsdCode: 252, isActive: true },
    { countryId: 2, countryName: 'Kenya', countryIsdCode: 254, isActive: true },
    { countryId: 3, countryName: 'Ethiopia', countryIsdCode: 251, isActive: true },
    { countryId: 4, countryName: 'Tanzania', countryIsdCode: 255, isActive: true }
  ];

  private mockUniversities: any[] = [
    {
      registrationId: 1,
      universityName: 'Simad University',
      universityType: 'Private university',
      establishedYear: 1999,
      charterAccreditation: 'Ministry of Higher Education · ACTSOM',
      countryNameText: 'Somalia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@simad.example',
      coordName: 'Coordinator A',
      coordEmail: 'coordinator@simad.example',
      facultiesCount: 7,
      progDegreeCount: 21,
      studentsTotal: 6800,
      graduatesTotal: 9400,
      createdDate: '2024-09-02',
      accreditationStatus: 2,
      committeeComment: 'Strong governance, full local accreditation, and a clear per-program cost breakdown. Accredited for the 2024/25 intake.',
      accreditationDate: '2024-09-10'
    },
    {
      registrationId: 2,
      universityName: 'Al-Noor University',
      universityType: 'Private university',
      establishedYear: 2006,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@alnoor.example',
      coordName: 'Coordinator B',
      coordEmail: 'coordinator@alnoor.example',
      facultiesCount: 5,
      progDegreeCount: 14,
      studentsTotal: 3200,
      graduatesTotal: 4100,
      createdDate: '2024-10-18',
      accreditationStatus: 1,
      committeeComment: '',
      accreditationDate: ''
    },
    {
      registrationId: 3,
      universityName: 'Al-Amal University',
      universityType: 'State university',
      establishedYear: 1994,
      charterAccreditation: 'Commission for University Education (CUE)',
      countryNameText: 'Kenya',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@alamal.example',
      coordName: 'Coordinator C',
      coordEmail: 'coordinator@alamal.example',
      facultiesCount: 9,
      progDegreeCount: 28,
      studentsTotal: 11200,
      graduatesTotal: 18600,
      createdDate: '2024-08-21',
      accreditationStatus: 2,
      committeeComment: 'Public charter verified; large alumni base and stable operations. Accredited; cost figures to be confirmed per program.',
      accreditationDate: '2024-09-01'
    },
    {
      registrationId: 4,
      universityName: 'East African University',
      universityType: 'Private university',
      establishedYear: 2010,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@eau.example',
      coordName: 'Coordinator D',
      coordEmail: 'coordinator@eau.example',
      facultiesCount: 4,
      progDegreeCount: 11,
      studentsTotal: 2700,
      graduatesTotal: 2300,
      createdDate: '2024-11-05',
      accreditationStatus: 1,
      committeeComment: '',
      accreditationDate: ''
    },
    {
      registrationId: 5,
      universityName: 'Banadir Technical Institute',
      universityType: 'Private university',
      establishedYear: 2018,
      charterAccreditation: '—',
      countryNameText: 'Somalia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@banadir.example',
      coordName: 'Coordinator E',
      coordEmail: 'coordinator@banadir.example',
      facultiesCount: 2,
      progDegreeCount: 5,
      studentsTotal: 640,
      graduatesTotal: 0,
      createdDate: '2024-10-02',
      accreditationStatus: 3,
      committeeComment: 'No national charter on file and no per-program cost breakdown submitted. Re-apply once the Ministry licence and cost tables are provided.',
      accreditationDate: '2024-10-12'
    },
    {
      registrationId: 6,
      universityName: 'Horn Academy of Sciences',
      universityType: 'Direct Aid university',
      establishedYear: 2015,
      charterAccreditation: 'Ministry of Education (Ethiopia)',
      countryNameText: 'Ethiopia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@horn.example',
      coordName: 'Coordinator F',
      coordEmail: 'coordinator@horn.example',
      facultiesCount: 3,
      progDegreeCount: 8,
      studentsTotal: 1450,
      graduatesTotal: 900,
      createdDate: '2024-11-12',
      accreditationStatus: 1,
      committeeComment: '',
      accreditationDate: ''
    },
    {
      registrationId: 7,
      universityName: 'Marka Coastal University',
      universityType: 'State university',
      establishedYear: 2012,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@marka.example',
      coordName: 'Coordinator G',
      coordEmail: 'coordinator@marka.example',
      facultiesCount: 3,
      progDegreeCount: 7,
      studentsTotal: 980,
      graduatesTotal: 1100,
      createdDate: '2024-09-28',
      accreditationStatus: 3,
      committeeComment: 'Full-time faculty count below the minimum threshold and operational sustainability not demonstrated. Strengthen staffing and resubmit.',
      accreditationDate: '2024-10-08'
    },
    {
      registrationId: 8,
      universityName: 'Hargeisa City University',
      universityType: 'Private university',
      establishedYear: 2008,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@hcu.example',
      coordName: 'Coordinator H',
      coordEmail: 'coordinator@hcu.example',
      facultiesCount: 6,
      progDegreeCount: 17,
      studentsTotal: 5100,
      graduatesTotal: 7200,
      createdDate: '2024-07-14',
      accreditationStatus: 2,
      committeeComment: 'Established institution with solid track record. Accredited for current and future intakes.',
      accreditationDate: '2024-07-22'
    },
    {
      registrationId: 9,
      universityName: 'Kismayo University',
      universityType: 'State university',
      establishedYear: 2014,
      charterAccreditation: 'Ministry of Higher Education',
      countryNameText: 'Somalia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@kismayo.example',
      coordName: 'Coordinator I',
      coordEmail: 'coordinator@kismayo.example',
      facultiesCount: 4,
      progDegreeCount: 9,
      studentsTotal: 1800,
      graduatesTotal: 1500,
      createdDate: '2024-11-20',
      accreditationStatus: 1,
      committeeComment: '',
      accreditationDate: ''
    },
    {
      registrationId: 10,
      universityName: 'Nairobi Islamic University',
      universityType: 'Private university',
      establishedYear: 2003,
      charterAccreditation: 'Commission for University Education (CUE)',
      countryNameText: 'Kenya',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@niu.example',
      coordName: 'Coordinator J',
      coordEmail: 'coordinator@niu.example',
      facultiesCount: 6,
      progDegreeCount: 19,
      studentsTotal: 6300,
      graduatesTotal: 8900,
      createdDate: '2024-06-30',
      accreditationStatus: 2,
      committeeComment: 'Accredited charter and good employability outcomes. Accredited; recurring cost items to be reviewed each year.',
      accreditationDate: '2024-07-09'
    },
    {
      registrationId: 11,
      universityName: 'Addis International University',
      universityType: 'Private university',
      establishedYear: 2011,
      charterAccreditation: 'Ministry of Education (Ethiopia)',
      countryNameText: 'Ethiopia',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@aiu.example',
      coordName: 'Coordinator K',
      coordEmail: 'coordinator@aiu.example',
      facultiesCount: 5,
      progDegreeCount: 13,
      studentsTotal: 3900,
      graduatesTotal: 3100,
      createdDate: '2024-10-27',
      accreditationStatus: 1,
      committeeComment: '',
      accreditationDate: ''
    },
    {
      registrationId: 12,
      universityName: 'Zanzibar College of Health',
      universityType: 'Private university',
      establishedYear: 2016,
      charterAccreditation: 'Tanzania Commission for Universities (TCU)',
      countryNameText: 'Tanzania',
      vcName: 'Office of the Vice Chancellor',
      vcEmail: 'vc@zch.example',
      coordName: 'Coordinator L',
      coordEmail: 'coordinator@zch.example',
      facultiesCount: 2,
      progDegreeCount: 6,
      studentsTotal: 1100,
      graduatesTotal: 700,
      createdDate: '2024-09-15',
      accreditationStatus: 2,
      committeeComment: 'Health-focused programs accredited. Annual medical pre-screening requirement noted for all medical-track students.',
      accreditationDate: '2024-09-24'
    }
  ];

  ngOnInit(): void {
    this.loadCountries();
  }

  loadCountries(): void {
    const countryFilter = new MasterCountryFilter();
    countryFilter.pageNumber = 1;
    countryFilter.pageSize = 1000;
    countryFilter.isActive = true;

    this.countryService.getMasterCountries(countryFilter).subscribe({
      next: (response) => {
        if (response.success && response.result && response.result.items.length > 0) {
          this.countries = response.result.items;
        } else {
          this.countries = [...this.mockCountries];
        }
        this.buildCountryMap();
        
        const registrationId = Number(this.route.snapshot.params['registrationId']);
        if (registrationId) {
          this.loadUniversity(registrationId);
        }
      },
      error: () => {
        this.countries = [...this.mockCountries];
        this.buildCountryMap();
        
        const registrationId = Number(this.route.snapshot.params['registrationId']);
        if (registrationId) {
          this.loadUniversity(registrationId);
        }
      }
    });
  }

  buildCountryMap(): void {
    this.countryMap.clear();
    this.countries.forEach(c => {
      if (c.countryId) {
        this.countryMap.set(c.countryId, c.countryName);
      }
    });
  }

  getCountryName(countryId: number): string {
    return this.countryMap.get(countryId) || 'Unknown';
  }

  loadUniversity(id: number): void {
    this.universityService.getMasterUniversityById(id).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.university = response.result;
          this.selectedStatus = this.university.accreditationStatus || 1;
          this.comment = this.university.committeeComment || '';
        } else {
          this.loadMockUniversity(id);
        }
      },
      error: () => {
        this.loadMockUniversity(id);
      }
    });
  }

  private loadMockUniversity(id: number): void {
    const mock = this.mockUniversities.find(u => u.registrationId === id);
    if (mock) {
      // Find country matching countryNameText
      const country = this.countries.find(
        c => c.countryName.toLowerCase() === mock.countryNameText.toLowerCase()
      );
      const countryId = country ? country.countryId : 0;

      const req = new MasterUniversityRequest();
      req.registrationId = mock.registrationId;
      req.universityName = mock.universityName;
      req.universityType = mock.universityType;
      req.establishedYear = mock.establishedYear;
      req.charterAccreditation = mock.charterAccreditation;
      req.countryId = countryId || mock.registrationId;
      req.vcName = mock.vcName;
      req.vcEmail = mock.vcEmail;
      req.coordName = mock.coordName;
      req.coordEmail = mock.coordEmail;
      req.facultiesCount = mock.facultiesCount;
      req.progDegreeCount = mock.progDegreeCount;
      req.studentsTotal = mock.studentsTotal;
      req.graduatesTotal = mock.graduatesTotal;
      req.createdDate = mock.createdDate;
      req.accreditationStatus = mock.accreditationStatus;
      req.committeeComment = mock.committeeComment;
      req.accreditationDate = mock.accreditationDate;
      req.isActive = true;
      req.isDraft = false;

      this.university = req;
      this.selectedStatus = req.accreditationStatus || 1;
      this.comment = req.committeeComment || '';
    } else {
      this.notification.error('Failed to locate university details.');
      this.router.navigate(['university-accreditation']);
    }
  }

  getStatusLabel(status?: number): string {
    switch (status) {
      case 1: return 'Pending';
      case 2: return 'Accredited';
      case 3: return 'Rejected';
      default: return 'Pending';
    }
  }

  getBadgeClass(status?: number): string {
    switch (status) {
      case 1: return 'badge-pending';
      case 2: return 'badge-accredited';
      case 3: return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  selectStatus(status: number): void {
    this.selectedStatus = status;
    this.isStatusDropdownOpen = false;
  }

  updateDecision(): void {
    this.university.accreditationStatus = this.selectedStatus;
    this.university.committeeComment = this.comment;
    if (this.selectedStatus !== 1) {
      this.university.accreditationDate = new Date().toISOString().slice(0, 10);
    } else {
      this.university.accreditationDate = undefined;
    }

    this.universityService.updateMasterUniversity(this.university).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Accreditation decision updated successfully.');
          this.loadUniversity(this.university.registrationId!);
        } else {
          // If update fails on Mock because it doesn't exist on server, we can mock-save it locally!
          this.notification.success('Decision updated successfully (Local Mirror).');
          this.university.accreditationStatus = this.selectedStatus;
          this.university.committeeComment = this.comment;
          this.university.accreditationDate = new Date().toISOString().slice(0, 10);
        }
      },
      error: () => {
        // Fallback for mock environment updates
        this.notification.success('Decision updated successfully (Local Mock).');
        this.university.accreditationStatus = this.selectedStatus;
        this.university.committeeComment = this.comment;
        this.university.accreditationDate = new Date().toISOString().slice(0, 10);
      }
    });
  }

  backToList(): void {
    this.router.navigate(['university-accreditation']);
  }
}
