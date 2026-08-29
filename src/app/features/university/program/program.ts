import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { FacultyFilter } from '../../../core/models/university/faculties/faculty-filter.model';
import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { NotificationService } from '../../../core/services/common/notification.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { FacultyService } from '../../../core/services/university/faculty.service';
import { SponsorshipTypeRequest } from '../../../core/models/ngo/sponsorship-type/sponsorship-type-request.model';
import { SponsorshipTypeService } from '../../../core/services/ngo/sponsorship-type.service';
import { SponsorshipTypeFilter } from '../../../core/models/ngo/sponsorship-type/sponsorship-type-filter.model';
import { DocumentTypeRequest } from '../../../core/models/ngo/document-type/document-type-request.model';
import { DocumentTypeFilter } from '../../../core/models/ngo/document-type/document-type-filter.model';
import { DocumentTypeService } from '../../../core/services/university/document-type.service';
import { ProgramService } from '../../../core/services/university/programs.service';
import { ProgramRequest } from '../../../core/models/university/programs/program-request.model';
import { ProgramCost } from '../../../core/models/university/programs/program-cost.model';
import { ProgramCourse } from '../../../core/models/university/programs/program-course.model';
import { ProgramDocument } from '../../../core/models/university/programs/program-document.model';
import { CourseFilter } from '../../../core/models/university/courses/course-filter.model';
import { CourseRequest } from '../../../core/models/university/courses/course-request.model';
import { CourseService } from '../../../core/services/university/course.service';
import { StaffType } from '../../../core/enums/staff-type.enum';
import { AppRoutes } from '../../../core/constants/app-routes';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { MasterDropDownService } from '../../../core/services/superadmin/master-dropdown.service';
import { MasterDropDownRequest } from '../../../core/models/super-admin/master-dropdown/master-dropdown-request.model';
import { MainDropdown } from '../../../core/enums/main-dropdown.enum';



@Component({
  selector: 'app-program',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './program.html',
  styleUrl: './program.scss',
})
export class Program implements OnInit {
  private notification = inject(NotificationService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private facultyService = inject(FacultyService);
  private sponsorshipTypeService = inject(SponsorshipTypeService);
  private documentTypeService = inject(DocumentTypeService);
  private courseService = inject(CourseService);
  private programService = inject(ProgramService);
  private masterDropDownService = inject(MasterDropDownService);

  programId = 0;
  isEditMode = false;

  program: ProgramRequest = new ProgramRequest();
  faculties: FacultyRequest[] = [];
  courses: CourseRequest[] = [];
  sponsorshipTypes: SponsorshipTypeRequest[] = [];
  documentTypes: DocumentTypeRequest[] = [];

  highSchoolDivision: MasterDropDownRequest[] = [];
  tanzanianStudentsCombination: MasterDropDownRequest[] = [];
  degrees: MasterDropDownRequest[] = [];

  isFacultyDropdownOpen = false;
  isHsDropdownOpen = false;
  isTzDropdownOpen = false;
  isDegreeDropdownOpen = false;
  isAddDocDropdownOpen = false;
  isAddCourseDropdownOpen = false;
  selectedCourseToAdd = 0;
  openSemesterDropdownCourseId: number | null = null;

  currentStaffType?: StaffType;

  ngOnInit(): void {
    const user = this.currentUserProfileService.getCurrentUserProfile();
    if (user) {
      this.currentStaffType = user.staffType;
    }

    this.programId = Number(this.route.snapshot.params['programId'] || this.route.snapshot.params['id'] || 0);
    this.isEditMode = this.programId > 0;

    this.getFaculties();
    this.getDocumentTypes();
    this.getHighSchoolDivision();
    this.getTanzanianStudentsCombination();
    this.getDegrees();

    if (this.isEditMode) {
      this.getProgramById(this.programId);
    } else {
      this.getSponsorshipTypes();
      this.getCourses();
    }
  }

  getProgramById(id: number): void {
    this.programService.getProgramById(id).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.program = response.result;
          if (this.program.facultyId && this.program.facultyId > 0) {
            this.getCourses();
          }
          this.getSponsorshipTypes();
          return;
        }
        this.notification.warning(
          response.message || 'Failed to load program details.'
        );
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load program details.'
        );
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.closeAllDropdowns();
  }

  closeAllDropdowns(): void {
    this.isFacultyDropdownOpen = false;
    this.isHsDropdownOpen = false;
    this.isTzDropdownOpen = false;
    this.isAddDocDropdownOpen = false;
    this.isAddCourseDropdownOpen = false;
    this.isDegreeDropdownOpen = false;
    this.openSemesterDropdownCourseId = null;
  }

  // Faculty Dropdown
  toggleFacultyDropdown(event: Event): void {
    event.stopPropagation();
    const isOpen = this.isFacultyDropdownOpen;
    this.closeAllDropdowns();
    this.isFacultyDropdownOpen = !isOpen;
  }

  selectFaculty(facultyId: number): void {
    this.program.facultyId = facultyId;
    this.isFacultyDropdownOpen = false;
    this.getCourses();
  }

  clearFaculty(event: Event): void {
    event.stopPropagation();
    this.program.facultyId = 0;
    this.isFacultyDropdownOpen = false;
  }

  getFaculties(): void {
    const filter = new FacultyFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;
    filter.isActive = true;

    this.facultyService.getFaculties(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.faculties = response.result.items;
          return;
        } this.faculties = [];
        this.notification.warning(
          response.message || 'Failed to load faculties.'
        );
      },
      error: (error) => {
        this.faculties = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load faculties.'
        );
      }
    });
  }

  getSelectedFacultyName(): string {
    const faculty = this.faculties.find(f => f.facultyId === this.program.facultyId);
    return faculty ? faculty.facultyName : 'Select faculty...';
  }

  // Degree Dropdown
  toggleDegreeDropdown(event: Event): void {
    event.stopPropagation();
    const isOpen = this.isDegreeDropdownOpen;
    this.closeAllDropdowns();
    this.isDegreeDropdownOpen = !isOpen;
  }

  selectDegree(degree: MasterDropDownRequest): void {
    this.program.degree = degree.uniqueId ?? 0;
    this.isDegreeDropdownOpen = false;
  }

  clearDegree(event: Event): void {
    event.stopPropagation();
    this.program.degree = 0;
    this.isDegreeDropdownOpen = false;
  }

  getSelectedDegreeName(): string {
    const match = this.degrees.find(d => d.uniqueId === this.program.degree);
    return match ? match.displayText : 'Select degree...';
  }

  // Master Dropdown API calls
  getHighSchoolDivision(): void {
    this.masterDropDownService.getByParentId(MainDropdown.HighSchoolDivision).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.highSchoolDivision = response.result;
          return;
        }
        this.highSchoolDivision = [];
        this.notification.warning(
          response.message || 'Failed to load high school divisions.'
        );
      },
      error: (error) => {
        this.highSchoolDivision = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load high school divisions.'
        );
      }
    });
  }

  getTanzanianStudentsCombination(): void {
    this.masterDropDownService.getByParentId(MainDropdown.TanzanianStudentsCombination).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.tanzanianStudentsCombination = response.result;
          return;
        } this.tanzanianStudentsCombination = [];
        this.notification.warning(
          response.message || 'Failed to load Tanzanian combinations.'
        );
      },
      error: (error) => {
        this.tanzanianStudentsCombination = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load Tanzanian combinations.'
        );
      }
    });
  }

  getDegrees(): void {
    this.masterDropDownService.getByParentId(MainDropdown.Degrees).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.degrees = response.result;
          return;
        }
        this.degrees = [];
        this.notification.warning(
          response.message || 'Failed to load degrees.'
        );
      },
      error: (error) => {
        this.degrees = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load degrees.'
        );
      }
    });
  }

  // Helper mappings for HighSchoolDivisionEnum string matching
  getEnumNameFromDisplayText(displayText: string): string {
    if (!displayText) return '';
    return displayText.split('—')[0].trim();
  }

  // High School Division Dropdown
  toggleHsDropdown(event: Event): void {
    event.stopPropagation();
    const isOpen = this.isHsDropdownOpen;
    this.closeAllDropdowns();
    this.isHsDropdownOpen = !isOpen;
  }

  isHsSelected(item: MasterDropDownRequest): boolean {
    return this.getSelectedHsDivisions().some(x => x.uniqueId === item.uniqueId);
  }

  getSelectedHsDivisions(): MasterDropDownRequest[] {
    if (!this.program.allowedHighSchoolDivisions || !this.highSchoolDivision) return [];
    const selectedNames = this.program.allowedHighSchoolDivisions.split(',').map(s => s.trim());
    return this.highSchoolDivision.filter(item => {
      const enumName = this.getEnumNameFromDisplayText(item.displayText);
      return selectedNames.includes(enumName);
    });
  }

  setSelectedHsDivisions(selected: MasterDropDownRequest[]): void {
    const names = selected.map(item => this.getEnumNameFromDisplayText(item.displayText)).filter(s => s.length > 0);
    this.program.allowedHighSchoolDivisions = names.join(',');
  }

  toggleHsDivision(val: MasterDropDownRequest): void {
    let current = this.getSelectedHsDivisions();
    if (current.some(item => item.uniqueId === val.uniqueId)) {
      current = current.filter(item => item.uniqueId !== val.uniqueId);
    } else {
      current.push(val);
    }
    this.setSelectedHsDivisions(current);
  }

  removeHsDivision(val: MasterDropDownRequest): void {
    let current = this.getSelectedHsDivisions();
    current = current.filter(item => item.uniqueId !== val.uniqueId);
    this.setSelectedHsDivisions(current);
  }

  // Tanzanian Combination Dropdown
  toggleTzDropdown(event: Event): void {
    event.stopPropagation();
    const isOpen = this.isTzDropdownOpen;
    this.closeAllDropdowns();
    this.isTzDropdownOpen = !isOpen;
  }

  isTzSelected(item: MasterDropDownRequest): boolean {
    return this.getSelectedTanzanianCombinations().some(x => x.uniqueId === item.uniqueId);
  }

  getSelectedTanzanianCombinations(): MasterDropDownRequest[] {
    if (!this.program.allowedTanzanianCombinations || !this.tanzanianStudentsCombination) return [];
    const selectedNames = this.program.allowedTanzanianCombinations.split(',').map(s => s.trim());
    return this.tanzanianStudentsCombination.filter(item => {
      const enumName = this.getEnumNameFromDisplayText(item.displayText);
      return selectedNames.includes(enumName);
    });
  }

  setSelectedTanzanianCombinations(selected: MasterDropDownRequest[]): void {
    const names = selected.map(item => this.getEnumNameFromDisplayText(item.displayText)).filter(s => s.length > 0);
    this.program.allowedTanzanianCombinations = names.join(',');
  }

  toggleTzCombination(val: MasterDropDownRequest): void {
    let current = this.getSelectedTanzanianCombinations();
    if (current.some(item => item.uniqueId === val.uniqueId)) {
      current = current.filter(item => item.uniqueId !== val.uniqueId);
    } else {
      current.push(val);
    }
    this.setSelectedTanzanianCombinations(current);
  }

  removeTzCombination(val: MasterDropDownRequest): void {
    let current = this.getSelectedTanzanianCombinations();
    current = current.filter(item => item.uniqueId !== val.uniqueId);
    this.setSelectedTanzanianCombinations(current);
  }

  getTanzanianCombinationLabel(value: string): string {
    switch (value) {
      case 'PCM': return 'PCM — Physics, Chemistry, Math';
      case 'PCB': return 'PCB — Physics, Chemistry, Biology';
      case 'CBG': return 'CBG — Chemistry, Biology, Geography';
      case 'HGE': return 'HGE — History, Geography, Economics';
      case 'HKL': return 'HKL — History, Kiswahili, Literature';
      case 'ECA': return 'ECA — Economics, Commerce, Accountancy';
      default: return value;
    }
  }

  // Document Management
  getDocumentTypes(): void {
    const filter = new DocumentTypeFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;
    filter.isActive = true;

    this.documentTypeService.getDocumentTypes(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.documentTypes = response.result.items;
          return;
        }
        this.documentTypes = [];
        this.notification.warning(
          response.message || 'Failed to load document types.'
        );
      },
      error: (error) => {
        this.documentTypes = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load document types.'
        );
      }
    });
  }

  toggleAddDocDropdown(event: Event): void {
    event.stopPropagation();
    const isOpen = this.isAddDocDropdownOpen;
    this.closeAllDropdowns();
    this.isAddDocDropdownOpen = !isOpen;
  }

  getAvailableDocumentTypes(): DocumentTypeRequest[] {
    if (!this.program.documents) this.program.documents = [];
    const addedIds = new Set(this.program.documents.map(d => d.documentTypeId));
    return this.documentTypes.filter(dt => dt.documentTypeId && !addedIds.has(dt.documentTypeId));
  }

  addDocument(docType: DocumentTypeRequest): void {
    if (!this.program.documents) this.program.documents = [];
    const doc = new ProgramDocument();
    doc.documentTypeId = docType.documentTypeId ?? 0;
    doc.documentTypeName = docType.documentName;
    doc.isRequired = true;
    this.program.documents.push(doc);
    this.isAddDocDropdownOpen = false;
  }

  removeDocument(doc: ProgramDocument): void {
    if (this.program.documents) {
      this.program.documents = this.program.documents.filter(d => d !== doc);
    }
  }

  setDocumentRequired(doc: ProgramDocument, required: boolean): void {
    doc.isRequired = required;
  }

  // Cost Management
  getSponsorshipTypes(): void {
    const filter = new SponsorshipTypeFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;
    filter.isActive = true;

    this.sponsorshipTypeService.getSponsorshipTypes(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.sponsorshipTypes = response.result.items;
          if (!this.program.costs) {
            this.program.costs = [];
          }
          this.sponsorshipTypes.forEach(st => {
            if (st.sponsorshipTypeId) {
              const exists = this.program.costs.some(c => c.sponsorshipTypeId === st.sponsorshipTypeId);
              if (!exists) {
                const cost = new ProgramCost();
                cost.sponsorshipTypeId = st.sponsorshipTypeId;
                cost.sponsorshipTypeName = st.sponsorshipName;
                cost.amount = 0;
                cost.frequencyTypeId = st.frequencyType;
                this.program.costs.push(cost);
              } else {
                const cost = this.program.costs.find(c => c.sponsorshipTypeId === st.sponsorshipTypeId);
                if (cost && cost.frequencyTypeId === undefined) {
                  cost.frequencyTypeId = st.frequencyType;
                }
              }
            }
          });
          return;
        }
        this.sponsorshipTypes = [];
        this.notification.warning(
          response.message || 'Failed to load sponsorship types.'
        );
      },
      error: (error) => {
        this.sponsorshipTypes = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load sponsorship types.'
        );
      }
    });
  }

  getProgramCost(sponsorshipTypeId: number): ProgramCost {
    let cost = this.program.costs?.find(c => c.sponsorshipTypeId === sponsorshipTypeId);
    if (!cost) {
      cost = new ProgramCost();
      cost.sponsorshipTypeId = sponsorshipTypeId;
      cost.amount = 0;
      if (!this.program.costs) this.program.costs = [];
      this.program.costs.push(cost);
    }
    return cost;
  }

  getRecurringTotal(): number {
    if (!this.program.costs || !this.sponsorshipTypes) return 0;
    return this.program.costs
      .filter(c => {
        const st = this.sponsorshipTypes.find(t => t.sponsorshipTypeId === c.sponsorshipTypeId);
        return (st && st.frequencyType === 2) || c.frequencyTypeId === 2;
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  getOneTimeTotal(): number {
    if (!this.program.costs || !this.sponsorshipTypes) return 0;
    return this.program.costs
      .filter(c => {
        const st = this.sponsorshipTypes.find(t => t.sponsorshipTypeId === c.sponsorshipTypeId);
        return (st && st.frequencyType === 1) || c.frequencyTypeId === 1;
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  getTotalCredits(): number {
    if (!this.program.courses) return 0;
    return this.program.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
  }

  getGrandTotal(): number {
    const recurringTotal = this.getRecurringTotal();
    const oneTimeTotal = this.getOneTimeTotal();
    const semCount = this.program.numberOfSemesters > 0 ? this.program.numberOfSemesters : 8;
    return (recurringTotal * semCount) + oneTimeTotal;
  }

  getAveragePerSemester(): number {
    const semCount = this.program.numberOfSemesters > 0 ? this.program.numberOfSemesters : 8;
    return semCount > 0 ? this.getGrandTotal() / semCount : 0;
  }

  getCostPerCredit(): number {
    const credits = this.getTotalCredits();
    return credits > 0 ? this.getGrandTotal() / credits : 0;
  }

  // Course Management
  getCourses(): void {
    const filter = new CourseFilter();
    filter.pageNumber = 1;
    filter.pageSize = 0;
    filter.isActive = true;
    filter.facultyId = this.program.facultyId > 0 ? this.program.facultyId : undefined;

    this.courseService.getCourses(filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.courses = response.result.items;
          return;
        }
        this.courses = [];
        if (filter.facultyId && response.message === 'Data not found') {
          this.notification.warning(
            'No courses are mapped to the selected faculty.'
          );
          return;
        }
        this.notification.warning(
          response.message || 'Failed to load courses.'
        );

      },
      error: (error) => {
        this.courses = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load courses.'
        );
      }
    });
  }

  getSelectedCourseToAddName(): string {
    const course = this.courses.find(c => c.courseId === this.selectedCourseToAdd);
    return course ? `${course.courseNameEn} (${course.courseCode})` : 'Select course...';
  }

  toggleAddCourseDropdown(event: Event): void {
    event.stopPropagation();
    const isOpen = this.isAddCourseDropdownOpen;
    this.closeAllDropdowns();
    this.isAddCourseDropdownOpen = !isOpen;
  }

  selectCourseToAdd(id: number, event: Event): void {
    event.stopPropagation();
    this.selectedCourseToAdd = id;
    this.isAddCourseDropdownOpen = false;
  }

  addCourseToProgram(): void {
    if (this.selectedCourseToAdd === 0) {
      this.notification.warning('Please select a course first.');
      return;
    }

    const course = this.courses.find(c => c.courseId === this.selectedCourseToAdd);
    if (!course) return;

    if (!this.program.courses) {
      this.program.courses = [];
    }

    if (this.program.courses.some(c => c.courseId === this.selectedCourseToAdd)) {
      this.notification.warning('Course already added');
      return;
    }

    const newProgCourse = new ProgramCourse();
    newProgCourse.courseId = course.courseId ?? 0;
    newProgCourse.courseNameEn = course.courseNameEn;
    newProgCourse.courseNameAr = course.courseNameAr;
    newProgCourse.courseCode = course.courseCode;
    newProgCourse.courseType = 1; // Core by default
    newProgCourse.credits = 0;
    newProgCourse.semesterNo = 1;

    this.program.courses.push(newProgCourse);
    this.recalculateDisplayOrders();
    this.selectedCourseToAdd = 0;
  }

  removeCourse(c: ProgramCourse): void {
    if (this.program.courses) {
      this.program.courses = this.program.courses.filter(course => course !== c);
      this.recalculateDisplayOrders();
    }
  }

  setCourseType(c: ProgramCourse, type: number): void {
    c.courseType = type;
  }

  toggleSemesterDropdown(courseId: number, event: Event): void {
    event.stopPropagation();
    if (this.openSemesterDropdownCourseId === courseId) {
      this.openSemesterDropdownCourseId = null;
    } else {
      this.closeAllDropdowns();
      this.openSemesterDropdownCourseId = courseId;
    }
  }

  selectSemesterForCourse(c: ProgramCourse, semesterNo: number): void {
    c.semesterNo = semesterNo;
    this.openSemesterDropdownCourseId = null;
  }

  getSemestersArray(): number[] {
    const limit = this.program.numberOfSemesters > 0 ? this.program.numberOfSemesters : 8;
    const sems = [];
    for (let i = 1; i <= limit; i++) {
      sems.push(i);
    }
    return sems;
  }

  validateAndClampCourseSemesters(): void {
    if (this.program.courses && this.program.courses.length > 0) {
      const maxSem = this.program.numberOfSemesters > 0 ? this.program.numberOfSemesters : 8;
      this.program.courses.forEach(c => {
        if (c.semesterNo > maxSem || c.semesterNo < 1) {
          c.semesterNo = 1;
        }
      });
    }
  }

  recalculateDisplayOrders(): void {
    if (this.program.courses) {
      this.program.courses.forEach((c, index) => {
        c.displayOrder = index + 1;
      });
    }
  }

  // Save / Actions
  saveDraft(): void {
    this.program.isDraft = true;
    this.program.accreditationStatus = 0; // Draft state
    this.saveProgram();
  }

  submitForAccreditation(): void {
    this.program.isDraft = false;
    this.program.accreditationStatus = 1; // Under review state
    this.program.submittedDate = new Date();
    this.saveProgram();
  }

  saveProgram(): void {
    this.recalculateDisplayOrders();

    if (this.program.courses && this.program.courses.length > 0) {
      const maxSem = this.program.numberOfSemesters > 0 ? this.program.numberOfSemesters : 8;
      if (this.program.courses.some(c => c.semesterNo < 1 || c.semesterNo > maxSem)) {
        this.notification.error(`All courses must be assigned to a semester between 1 and ${maxSem}.`);
        return;
      }
    }

    if (this.program.facultyId === 0) {
      this.notification.error('Faculty selection is required.');
      return;
    }
    if (this.program.degree === 0) {
      this.notification.error('Degree selection is required.');
      return;
    }
    if (!this.program.programName || !this.program.programName.trim()) {
      this.notification.error('Program name is required.');
      return;
    }
    if (!this.program.programCode || !this.program.programCode.trim()) {
      this.notification.error('Program code is required.');
      return;
    }

    const user = this.currentUserProfileService.getCurrentUserProfile();
    // if (user && user.universityId) {
    //   this.program.universityId = user.universityId;
    // }

    if (user?.universityIds?.length) {
      this.program.universityId = user.universityIds[0];
    }

    const request = (this.isEditMode || (this.program.programId && this.program.programId > 0))
      ? this.programService.updateProgram(this.program)
      : this.programService.addProgram(this.program);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Program saved successfully.');
          this.router.navigate([AppRoutes.University.Faculties]);
        } 
        
        this.notification.error(
          response.message || 'Failed to save program.'
        );
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to save program.'
        );
      }
    });
  }

  cancel(): void {
    this.router.navigate([AppRoutes.University.Faculties]);
  }
}
