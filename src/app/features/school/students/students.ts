import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { NotificationService } from '../../../core/services/common/notification.service';
import { StudentService } from '../../../core/services/school/student.service';
import { StudentRequest } from '../../../core/models/school/students/student-request.model';
import { MasterCountryService } from '../../../core/services/superadmin/master-country.service';
import { MasterCountryRequest } from '../../../core/models/super-admin/master-country/master-country-request.model';
import { MasterSchoolService } from '../../../core/services/school/master-school.service';
import { MasterSchoolRequest } from '../../../core/models/school/master-school/master-school-request.model';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';
import { AppRoutes } from '../../../core/constants/app-routes';
import { MasterCountryFilter } from '../../../core/models/super-admin/master-country/master-country-filter.model';
import { MasterSchoolFilter } from '../../../core/models/school/master-school/master-school-filter.model';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class Students implements OnInit {

  activeSection: number = 1;
  isPhoneDropdownOpen = false;
  PhoneCountryId: number | null = null;
  PhoneCountryCode = '';
  PhoneNumber = '';
  photoPreviewUrl: string | null = null;

  toggleSection(section: number): void {
    this.activeSection = this.activeSection === section ? 0 : section;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.closeAllDropdowns();
  }

  private studentService = inject(StudentService);
  private countryService = inject(MasterCountryService);
  private schoolService = inject(MasterSchoolService);
  private masterDropdownService = inject(MasterDropDownService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Model
  student = new StudentRequest();
  isEditMode = false;
  isLoading = false;
  isSaving = false;

  // Dropdown Data
  countries: MasterCountryRequest[] = [];
  schools: MasterSchoolRequest[] = [];
  genders: MasterDropDownRequest[] = [];
  religions: MasterDropDownRequest[] = [];
  financialStatuses: MasterDropDownRequest[] = [];
  assessmentLevels: MasterDropDownRequest[] = []; // high , medium , low
  hsDivisions: MasterDropDownRequest[] = [];
  tzCombinations: MasterDropDownRequest[] = [];

  // Dropdown States
  isNationalityOpen = false;
  isResidenceCountryOpen = false;
  isSchoolOpen = false;
  isGenderOpen = false;
  isReligionOpen = false;
  isFinancialStatusOpen = false;
  isSelfRelianceOpen = false;
  isMotivationOpen = false;
  isFutureGoalsOpen = false;
  isHsDivisionOpen = false;
  isTzCombinationOpen = false;

  // Dropdown Search texts
  searchNationality = '';
  searchResidenceCountry = '';
  searchSchool = '';
  searchTzCombination = '';

  ngOnInit(): void {
    this.student.fromDaSchool = false;
    this.student.isActive = true;
    this.loadAllLookups();
  }

  loadAllLookups(): void {
    this.isLoading = true;
    
    const countryFilter = new MasterCountryFilter();
    countryFilter.pageNumber = 1;
    countryFilter.pageSize = 1000;
    
    const schoolFilter = new MasterSchoolFilter();
    schoolFilter.pageNumber = 1;
    schoolFilter.pageSize = 1000;

    forkJoin({
      countries: this.countryService.getMasterCountries(countryFilter),
      schools: this.schoolService.getMasterSchools(schoolFilter),
      genders: this.masterDropdownService.getByParentId(MainDropdown.Gender),
      religions: this.masterDropdownService.getByParentId(MainDropdown.Religion),
      financial: this.masterDropdownService.getByParentId(MainDropdown.FinancialNeedStatus),
      assessment: this.masterDropdownService.getByParentId(MainDropdown.AssessmentLevel),
      hsDivisions: this.masterDropdownService.getByParentId(MainDropdown.HighSchoolDivision),
      tzCombinations: this.masterDropdownService.getByParentId(MainDropdown.TanzanianStudentsCombination)
    }).subscribe({
      next: (res) => {
        if (res.countries.success && res.countries.result) {
          this.countries = res.countries.result.items;
        }
        if (res.schools.success && res.schools.result) {
          this.schools = res.schools.result.items;
        }
        if (res.genders.success) this.genders = res.genders.result || [];
        if (res.religions.success) this.religions = res.religions.result || [];
        if (res.financial.success) this.financialStatuses = res.financial.result || [];
        if (res.assessment.success) this.assessmentLevels = res.assessment.result || [];
        if (res.hsDivisions.success) this.hsDivisions = res.hsDivisions.result || [];
        if (res.tzCombinations.success) this.tzCombinations = res.tzCombinations.result || [];

        this.checkRouteAndLoadData();
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Failed to load reference data.');
      }
    });
  }

  checkRouteAndLoadData(): void {
    const idParam = this.route.snapshot.params['id'];
    if (idParam && idParam !== 'new') {
      const studentId = Number(idParam);
      if (!isNaN(studentId)) {
        this.isEditMode = true;
        this.loadStudent(studentId);
        return;
      }
    }
    this.isLoading = false;
  }

  loadStudent(id: number): void {
    this.studentService.getStudentById(id).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.student = res.result;
          this.parsePhone(this.student.phone);
        } else {
          this.notification.error('Failed to load student details.');
          this.router.navigate([AppRoutes.School.CoordinatorStudents]);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Failed to retrieve student details.');
        this.router.navigate([AppRoutes.School.CoordinatorStudents]);
      }
    });
  }

  // Dropdown Utility logic
  
  // Phone Selection
  togglePhoneDropdown(event: Event): void {
    event.stopPropagation();
    const current = this.isPhoneDropdownOpen;
    this.closeAllDropdowns();
    this.isPhoneDropdownOpen = !current;
  }

  selectPhoneCountry(c: MasterCountryRequest): void {
    this.PhoneCountryId = c.countryId || null;
    this.PhoneCountryCode = c.countryIsdCode?.toString() || '';
    this.isPhoneDropdownOpen = false;
  }

  clearPhone(event: Event): void {
    event.stopPropagation();
    this.PhoneCountryId = null;
    this.PhoneCountryCode = '';
  }

  getPhoneCountryName(): string {
    const found = this.countries.find(c => c.countryId === this.PhoneCountryId);
    return found ? `${found.countryName} (+${found.countryIsdCode})` : 'Select Code...';
  }

  parsePhone(phone?: string): void {
    if (!phone) return;
    const matchingCountry = this.countries.find(c => {
      const code = '+' + c.countryIsdCode;
      return phone.startsWith(code);
    });

    if (matchingCountry) {
      this.PhoneCountryId = matchingCountry.countryId || null;
      this.PhoneCountryCode = matchingCountry.countryIsdCode?.toString() || '';
      const codeStr = '+' + this.PhoneCountryCode;
      this.PhoneNumber = phone.substring(codeStr.length);
    } else {
      this.PhoneNumber = phone;
    }
  }

  applyPhoneBeforeSave(): void {
    if (this.PhoneCountryCode && this.PhoneNumber) {
      const prefix = this.PhoneCountryCode.startsWith('+') ? this.PhoneCountryCode : '+' + this.PhoneCountryCode;
      this.student.phone = `${prefix}${this.PhoneNumber.replace(/\D/g, '')}`;
    } else {
      this.student.phone = this.PhoneNumber || '';
    }
  }

  closeAllDropdowns(): void {
    this.isNationalityOpen = false;
    this.isResidenceCountryOpen = false;
    this.isSchoolOpen = false;
    this.isGenderOpen = false;
    this.isReligionOpen = false;
    this.isFinancialStatusOpen = false;
    this.isSelfRelianceOpen = false;
    this.isMotivationOpen = false;
    this.isFutureGoalsOpen = false;
    this.isHsDivisionOpen = false;
    this.isTzCombinationOpen = false;
    this.isPhoneDropdownOpen = false;
  }

  toggleDropdown(event: Event, dropdownName: string): void {
    event.stopPropagation();
    const currentState = (this as any)[dropdownName];
    this.closeAllDropdowns();
    (this as any)[dropdownName] = !currentState;
  }

  // Selection Logic
  selectOption(field: keyof StudentRequest, value: any, dropdownName: string): void {
    (this.student as any)[field] = value;
    (this as any)[dropdownName] = false;
  }

  clearSelection(event: Event, field: keyof StudentRequest, dropdownName: string): void {
    event.stopPropagation();
    (this.student as any)[field] = null;
    (this as any)[dropdownName] = false;
  }

  // Getters for Display
  getCountryName(id?: number): string {
    if (!id) return 'Select Country';
    const found = this.countries.find(c => c.countryId === id);
    return found ? found.countryName : 'Select Country';
  }

  getSchoolName(id?: number): string {
    if (!id) return 'Select School';
    const found = this.schools.find(s => s.schoolId === id);
    return found ? found.schoolName : 'Select School';
  }

  getDropdownName(id: number | undefined, list: MasterDropDownRequest[], defaultText: string): string {
    if (!id) return defaultText;
    const found = list.find(x => x.uniqueId === id);
    return found ? found.displayText : defaultText;
  }

  getTzCombinationName(val?: string): string {
    if (!val) return 'Select Combination';
    const found = this.tzCombinations.find(x => x.displayText === val);
    return found ? found.displayText : val;
  }

  getHsDivisionName(val?: string): string {
    if (!val) return 'Select Division';
    const found = this.hsDivisions.find(x => x.displayText === val);
    return found ? found.displayText : val;
  }

  // Filtering Dropdown Lists
  filteredCountries(search: string = ''): MasterCountryRequest[] {
    if (!search) return this.countries;
    return this.countries.filter(c => c.countryName.toLowerCase().includes(search.toLowerCase()));
  }

  filteredSchools(search: string = ''): MasterSchoolRequest[] {
    if (!search) return this.schools;
    return this.schools.filter(s => s.schoolName.toLowerCase().includes(search.toLowerCase()));
  }

  get filteredTzCombinations(): MasterDropDownRequest[] {
    if (!this.searchTzCombination) return this.tzCombinations;
    return this.tzCombinations.filter(c => c.displayText.toLowerCase().includes(this.searchTzCombination.toLowerCase()));
  }

  // File Upload Handlers
  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.student.photoPath = file.name;
      this.photoPreviewUrl = URL.createObjectURL(file);
    }
  }

  clearPhoto(event: Event): void {
    event.stopPropagation();
    this.student.photoPath = undefined;
    this.photoPreviewUrl = null;
  }

  onRecommendationSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.student.recommendationLetterFile = file;
      this.student.recommendationLetterPath = file.name;
    }
  }

  clearRecommendation(event: Event): void {
    event.stopPropagation();
    this.student.recommendationLetterFile = undefined;
    this.student.recommendationLetterPath = undefined;
  }

  // Save Logic
  saveDraft(): void {
    this.applyPhoneBeforeSave();
    this.student.isDraft = true;
    this.submitForm();
  }

  saveStudent(): void {
    this.applyPhoneBeforeSave();
    // Very basic frontend validation checks for required fields
    if (!this.student.firstName || !this.student.lastName || !this.student.schoolId || !this.student.nationalityId) {
      this.notification.warning('Please fill in all required fields (Name, Nationality, School).');
      return;
    }
    this.student.isDraft = false;
    this.submitForm();
  }

  submitForm(): void {
    this.isSaving = true;

    if (this.isEditMode) {
      this.studentService.updateStudent(this.student).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('Student updated successfully.');
            this.router.navigate([AppRoutes.School.CoordinatorStudents]);
          } else {
            this.notification.error(res.message || 'Failed to update student.');
          }
          this.isSaving = false;
        },
        error: () => {
          this.notification.error('Error occurred while updating student.');
          this.isSaving = false;
        }
      });
    } else {
      this.studentService.addStudent(this.student).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('Student added successfully.');
            this.router.navigate([AppRoutes.School.CoordinatorStudents]);
          } else {
            this.notification.error(res.message || 'Failed to add student.');
          }
          this.isSaving = false;
        },
        error: () => {
          this.notification.error('Error occurred while saving student.');
          this.isSaving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate([AppRoutes.School.CoordinatorStudents]);
  }



  
}
