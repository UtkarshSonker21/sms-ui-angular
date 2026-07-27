import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { NotificationService } from '../../../core/services/common/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
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
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import { StudentProgramDocument } from '../../../core/models/school/student-program-application/student-program-document.model';
import { CandidateProgram } from '../../../core/models/school/student-program-application/candidate-program.model';
import { StudentHistory } from '../../../core/models/school/student-program-application/student-history.model';
import { ApplyRequest } from '../../../core/models/school/student-program-application/apply-request.model';
import { UploadDocumentRequest } from '../../../core/models/school/student-program-application/upload-document-request.model';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { StudentStatusService } from '../../../core/services/common/student-status.service';



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
  photoError = false;

  toggleSection(section: number): void {
    this.activeSection = this.activeSection === section ? 0 : section;
  }

  getPhotoUrl(path?: string): string {
    return HelperMethods.getFileUrl(path);
  }

  handlePhotoError(): void {
    this.photoError = true;
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
  private studentProgramService = inject(StudentProgramService);
  private confirmDialog = inject(ConfirmDialogService);
  private studentStatusService = inject(StudentStatusService);

  studentStatus = StudentStatusEnum;

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

  // Candidate Programs State
  activeTab: 'current' | 'available' = 'current';
  candidatePrograms: CandidateProgram[] = [];
  filteredCandidatePrograms: CandidateProgram[] = [];
  uploadingDocs = new Set<number>();
  uniqueFaculties: string[] = [];
  uniqueUniversities: string[] = [];
  
  searchCandidateProgram = '';
  selectedFaculty = '';
  selectedUniversity = '';
  
  isProgramFacultyOpen = false;
  isProgramUniversityOpen = false;
  isApplying = false;
  hasActiveApplication = false;

  expandedProgramId: number | null = null;
  expandedProgramDocuments: StudentProgramDocument[] = [];
  activeApplicationDocuments: StudentProgramDocument[] = [];
  isDocumentsLoading = false;

  get activeCandidateProgram(): CandidateProgram | undefined {
    return this.candidatePrograms.find(p => p.applicationId && p.applicationStatus !== undefined);
  }

  get availableCandidatePrograms(): CandidateProgram[] {
    return this.filteredCandidatePrograms.filter(p => !p.applicationId || p.applicationStatus === undefined);
  }

  isDiscussionModalOpen = false;
  currentDiscussionDocTypeId: number | null = null;
  currentDiscussionRemark = '';

  isApplyModalOpen = false;
  selectedApplyProgram: CandidateProgram | null = null;

  studentHistory: (StudentHistory & { icon?: string; color?: string })[] = [];

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
    const idParam = this.route.snapshot.paramMap.get('studentId');
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
          if (this.student.photoPath) {
            this.photoPreviewUrl = environment.apiUrl + this.student.photoPath;
          }
          this.loadCandidatePrograms();
          this.loadStudentHistory(id);
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


  
  // Candidate Programs Logic
  loadCandidatePrograms(): void {
    if (!this.student.studentId) return;

    this.activeApplicationDocuments = [];
    this.expandedProgramDocuments = [];
    this.expandedProgramId = null;
    this.hasActiveApplication = false;

    this.studentProgramService.getCandidatePrograms(this.student.studentId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.candidatePrograms = res.result;
          this.hasActiveApplication = this.candidatePrograms.some(p => p.applicationId && p.applicationStatus !== undefined);
          this.activeTab = this.hasActiveApplication ? 'current' : 'available';
          
          this.uniqueFaculties = [...new Set(this.candidatePrograms.map(p => p.facultyName).filter(f => f))];
          this.uniqueUniversities = [...new Set(this.candidatePrograms.map(p => p.universityName).filter(u => u))];
          
          this.filterCandidatePrograms();

          const activeApp = this.candidatePrograms.find(p => p.applicationId && p.applicationStatus !== undefined);
          if (activeApp && activeApp.applicationId) {
            this.studentProgramService.getDocuments(activeApp.applicationId).subscribe({
              next: (docRes) => {
                if (docRes.success && docRes.result) {
                  this.activeApplicationDocuments = docRes.result;
                  if (this.expandedProgramId === activeApp.programId) {
                    this.expandedProgramDocuments = docRes.result;
                  }
                } else {
                  this.activeApplicationDocuments = [];
                }
              },
              error: () => {
                this.activeApplicationDocuments = [];
              }
            });
          } else {
            this.activeApplicationDocuments = [];
          }
        }
      },
      error: () => {
        this.notification.error('Failed to load candidate programs.');
      }
    });
  }

  filterCandidatePrograms(): void {
    let filtered = this.candidatePrograms;

    if (this.searchCandidateProgram) {
      const term = this.searchCandidateProgram.toLowerCase();
      filtered = filtered.filter(p => 
        (p.programName && p.programName.toLowerCase().includes(term)) ||
        (p.programCode && p.programCode.toLowerCase().includes(term))
      );
    }

    if (this.selectedFaculty) {
      filtered = filtered.filter(p => p.facultyName === this.selectedFaculty);
    }

    if (this.selectedUniversity) {
      filtered = filtered.filter(p => p.universityName === this.selectedUniversity);
    }

    this.filteredCandidatePrograms = filtered;
  }

  selectProgramFilter(type: 'faculty' | 'university', value: string, dropdownProp: 'isProgramFacultyOpen' | 'isProgramUniversityOpen'): void {
    if (type === 'faculty') this.selectedFaculty = value;
    if (type === 'university') this.selectedUniversity = value;
    (this as any)[dropdownProp] = false;
    this.filterCandidatePrograms();
  }

  clearProgramFilter(event: Event, type: 'faculty' | 'university', dropdownProp: 'isProgramFacultyOpen' | 'isProgramUniversityOpen'): void {
    event.stopPropagation();
    if (type === 'faculty') this.selectedFaculty = '';
    if (type === 'university') this.selectedUniversity = '';
    (this as any)[dropdownProp] = false;
    this.filterCandidatePrograms();
  }

  canApply(prog: CandidateProgram): boolean {
    if (!prog || !prog.applicationId || prog.applicationStatusName !== 'Draft') return false;

    if (!prog.requiredDocuments || prog.requiredDocuments.length === 0) return true;
    return prog.requiredDocuments
      .filter(d => d.isRequired)
      .every(d => this.getUploadedDocStatus(d.documentTypeId) === 'Uploaded');
  }

  cancelProgramApplication(program: CandidateProgram): void {
    // TODO:
    // If documents are uploaded but the user decides not to apply,
    // later we will call an API to clean up orphan uploaded documents
    // and draft data.
  }

  openApplyModal(prog: CandidateProgram): void {
    if (this.isApplying || this.hasActiveApplication) return;
    this.selectedApplyProgram = prog;
    this.isApplyModalOpen = true;
  }

  closeApplyModal(): void {
    this.isApplyModalOpen = false;
    this.selectedApplyProgram = null;
  }

  confirmApply(): void {
    if (!this.selectedApplyProgram || this.isApplying || this.hasActiveApplication) return;
    
    this.isApplying = true;
    const req = new ApplyRequest();
    req.programId = this.selectedApplyProgram.programId;
    
    this.studentProgramService.apply(this.student.studentId!, req).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.selectedApplyProgram!.applicationId = res.result;
          this.selectedApplyProgram!.applicationStatus = StudentStatusEnum.Draft;
          this.selectedApplyProgram!.applicationStatusName = 'Draft';
          this.hasActiveApplication = true;
          this.activeTab = 'current';
          // Auto expand the row after draft is created so they can upload
          this.expandedProgramId = null; // Reset first so toggle expands it
          this.toggleProgramExpand(this.selectedApplyProgram!);
          this.closeApplyModal();
        } else {
          this.notification.error(res.message || 'Failed to create draft application.');
        }
        this.isApplying = false;
      },
      error: () => {
        this.notification.error('Error creating draft application.');
        this.isApplying = false;
      }
    });
  }

  submitProgramApplication(programId: number): void {
    if (this.isApplying) return;
    
    const prog = this.candidatePrograms.find(p => p.programId === programId);
    if (!prog || !prog.applicationId) return;
    
    if (!this.canApply(prog)) {
      this.notification.error('Please upload all required documents before submitting this program.');
      return;
    }
    
    this.confirmDialog.confirm({
      title: 'Submit Application',
      message: 'Are you sure you want to submit this application?\nOnce submitted, you will not be able to modify the application or uploaded documents.',
      cancelText: 'Cancel',
      confirmText: 'Yes, Submit',
      variant: 'info'
    }).then(confirmed => {
      if (!confirmed) return;

      this.isApplying = true;
      this.doSubmit(prog.applicationId!);
    });
  }

  private doSubmit(applicationId: number): void {
    this.studentProgramService.submitApplication(applicationId).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Successfully applied for program.');
          this.loadCandidatePrograms(); // Reload to get updated application ID and status
        } else {
          this.notification.error(res.message || 'Failed to submit application.');
        }
        this.isApplying = false;
      },
      error: () => {
        this.notification.error('Error submitting application.');
        this.isApplying = false;
      }
    });
  }

  cancelApplication(applicationId?: number): void {
    if (!applicationId || this.isApplying) return;

    this.confirmDialog.confirm({
      title: 'Cancel Application',
      message: 'Are you sure you want to cancel this application?\nAll uploaded documents will remain available until the application is cancelled.',
      cancelText: 'Keep Application',
      confirmText: 'Yes, Cancel',
      variant: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;

      this.isApplying = true;
      this.studentProgramService.cancelApplication(applicationId).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('Application cancelled successfully.');
            this.activeApplicationDocuments = [];
            this.expandedProgramDocuments = [];
            this.expandedProgramId = null;
            this.hasActiveApplication = false;
            this.loadCandidatePrograms();
          } else {
            this.notification.error(res.message || 'Failed to cancel application.');
          }
          this.isApplying = false;
        },
        error: () => {
          this.notification.error('Error cancelling application.');
          this.isApplying = false;
        }
      });
    });
  }

  toggleProgramExpand(prog: CandidateProgram): void {
    if (!prog.applicationId) return;

    if (this.expandedProgramId === prog.programId) {
      this.expandedProgramId = null;
      return;
    }
    
    this.expandedProgramId = prog.programId;
    this.expandedProgramDocuments = [];
    
    if (prog.applicationId) {
      this.isDocumentsLoading = true;
      this.studentProgramService.getDocuments(prog.applicationId).subscribe({
        next: (res) => {
          if (res.success && res.result) {
            this.expandedProgramDocuments = res.result;
            this.activeApplicationDocuments = res.result;
          }
          this.isDocumentsLoading = false;
        },
        error: () => {
          this.notification.error('Failed to load documents.');
          this.isDocumentsLoading = false;
        }
      });
    }
  }

  getUploadedDocStatus(documentTypeId: number): string {
    const doc = this.activeApplicationDocuments.find(d => d.documentTypeId === documentTypeId);
    return (doc && doc.storagePath && doc.storagePath.length > 0) ? 'Uploaded' : 'Pending Upload';
  }

  getRequiredDocsCount(prog: CandidateProgram): number {
    return prog.requiredDocuments?.filter(d => d.isRequired).length || 0;
  }

  getUploadedRequiredDocsCount(prog: CandidateProgram): number {
    if (!prog.requiredDocuments || !this.activeApplicationDocuments.length) return 0;
    return prog.requiredDocuments.filter(d => 
      d.isRequired && 
      this.activeApplicationDocuments.some(ad => ad.documentTypeId === d.documentTypeId)
    ).length;
  }

  openDiscussionModal(docTypeId: number): void {
    this.currentDiscussionDocTypeId = docTypeId;
    const existingDoc = this.activeApplicationDocuments.find(d => d.documentTypeId === docTypeId);
    this.currentDiscussionRemark = existingDoc?.reviewerRemark || '';
    this.isDiscussionModalOpen = true;
  }

  closeDiscussionModal(): void {
    this.isDiscussionModalOpen = false;
    this.currentDiscussionDocTypeId = null;
    this.currentDiscussionRemark = '';
  }

  saveDiscussionRemark(): void {
    if (!this.currentDiscussionDocTypeId) return;
    
    let existingDoc = this.activeApplicationDocuments.find(d => d.documentTypeId === this.currentDiscussionDocTypeId);
    if (existingDoc) {
      existingDoc.reviewerRemark = this.currentDiscussionRemark;
    } else {
      this.activeApplicationDocuments.push({
         documentTypeId: this.currentDiscussionDocTypeId,
         reviewerRemark: this.currentDiscussionRemark
      } as any);
    }
    
    this.notification.success('Remark saved successfully.');
    this.closeDiscussionModal();
  }

  getDiscussionCount(docTypeId: number): number {
    const doc = this.activeApplicationDocuments.find(d => d.documentTypeId === docTypeId);
    return (doc && doc.reviewerRemark && doc.reviewerRemark.trim().length > 0) ? 1 : 0;
  }

  // Program Document Upload Logic
  onFileSelected(event: any, doc: any, prog: CandidateProgram): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!prog.applicationId) {
      this.notification.error('A draft application must exist before uploading documents.');
      event.target.value = '';
      return;
    }

    this.uploadingDocs.add(doc.documentTypeId);
    this.executeDocumentUpload(file, doc, prog.applicationId, event);
  }

  private executeDocumentUpload(file: File, doc: any, applicationId: number, event: any): void {
    const req = new UploadDocumentRequest();
    req.programDocumentId = doc.programDocumentId;
    req.documentTypeId = doc.documentTypeId;
    req.file = file;

    this.studentProgramService.uploadDocument(applicationId, req).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.activeApplicationDocuments = this.activeApplicationDocuments.filter(d => d.documentTypeId !== doc.documentTypeId);
          this.activeApplicationDocuments.push(res.result);
          this.notification.success('Document uploaded successfully.');
        } else {
          this.notification.error(res.message || 'Failed to upload document.');
        }
        this.uploadingDocs.delete(doc.documentTypeId);
        event.target.value = ''; // Reset input
      },
      error: () => {
        this.notification.error('Error occurred during upload.');
        this.uploadingDocs.delete(doc.documentTypeId);
        event.target.value = '';
      }
    });
  }

  previewDocument(documentTypeId: number): void {
    const doc = this.activeApplicationDocuments.find(d => d.documentTypeId === documentTypeId);
    if (doc && doc.storagePath) {
      const previewUrl = HelperMethods.getFileUrl(doc.storagePath);
      window.open(previewUrl, '_blank');
    } else {
      this.notification.info('Document preview is not available.');
    }
  }

  removeDocument(doc: any, applicationId: number): void {
    this.confirmDialog.confirm({
      title: 'Remove Document',
      message: 'Are you sure you want to remove this document?\nThis action cannot be undone.',
      cancelText: 'Keep Document',
      confirmText: 'Remove',
      variant: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;

      const uploadedDoc = this.activeApplicationDocuments.find(d => d.documentTypeId === doc.documentTypeId);
      if (!uploadedDoc) return;

      this.studentProgramService.deleteDocument(applicationId, uploadedDoc.studentProgramDocumentId).subscribe({
        next: (res) => {
          if (res.success) {
            this.activeApplicationDocuments = this.activeApplicationDocuments.filter(d => d.documentTypeId !== doc.documentTypeId);
            this.notification.success('Document removed successfully.');
          } else {
            this.notification.error(res.message || 'Failed to remove document.');
          }
        },
        error: () => {
          this.notification.error('Error occurred while removing document.');
        }
      });
    });
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.studentService.uploadProfilePhoto(this.student.studentId || 0, file).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.student.photoPath = res.result;
          this.photoPreviewUrl = environment.apiUrl + res.result;
          this.photoError = false;
          this.notification.success('Profile photo uploaded successfully.');
        } else {
          this.notification.error(res.message || 'Failed to upload profile photo.');
        }
        event.target.value = '';
      },
      error: () => {
        this.notification.error('Error occurred during profile photo upload.');
        event.target.value = '';
      }
    });
  }

  removePhoto(event: Event): void {
    event.stopPropagation();
    this.confirmDialog.confirm({
      title: 'Remove Profile Photo',
      message: 'Are you sure you want to remove the profile photo?\nThis action cannot be undone.',
      cancelText: 'Keep Photo',
      confirmText: 'Remove',
      variant: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;

      this.studentService.deleteProfilePhoto(this.student.studentId || 0).subscribe({
        next: (res) => {
          if (res.success) {
            this.student.photoPath = undefined;
            this.photoPreviewUrl = null;
            this.photoError = false;
            this.notification.success('Profile photo removed successfully.');
          } else {
            this.notification.error(res.message || 'Failed to remove profile photo.');
          }
        },
        error: () => {
          this.notification.error('Error occurred while removing profile photo.');
        }
      });
    });
  }

  onRecommendationSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.studentService.uploadRecommendationLetter(this.student.studentId || 0, file).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.student.recommendationLetterPath = res.result;
          this.notification.success('Recommendation letter uploaded successfully.');
        } else {
          this.notification.error(res.message || 'Failed to upload recommendation letter.');
        }
        event.target.value = '';
      },
      error: () => {
        this.notification.error('Error occurred during recommendation letter upload.');
        event.target.value = '';
      }
    });
  }

  previewRecommendation(event: Event): void {
    event.stopPropagation();
    if (this.student.recommendationLetterPath) {
      const previewUrl = HelperMethods.getFileUrl(this.student.recommendationLetterPath);
      window.open(previewUrl, '_blank');
    } else {
      this.notification.info('Recommendation letter is not available.');
    }
  }

  removeRecommendation(event: Event): void {
    event.stopPropagation();
    this.confirmDialog.confirm({
      title: 'Remove Recommendation Letter',
      message: 'Are you sure you want to remove the recommendation letter?\nThis action cannot be undone.',
      cancelText: 'Keep Document',
      confirmText: 'Remove',
      variant: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;

      this.studentService.deleteRecommendationLetter(this.student.studentId || 0).subscribe({
        next: (res) => {
          if (res.success) {
            this.student.recommendationLetterPath = undefined;
            this.notification.success('Recommendation letter removed successfully.');
          } else {
            this.notification.error(res.message || 'Failed to remove recommendation letter.');
          }
        },
        error: () => {
          this.notification.error('Error occurred while removing recommendation letter.');
        }
      });
    });
  }

  // Save Logic
  saveDraft(): void {
    this.applyPhoneBeforeSave();
    this.student.isDraft = true;
    this.submitForm();
  }

  validateRequiredDocuments(): boolean {
    const activeApp = this.candidatePrograms.find(p => p.applicationId && p.applicationStatus !== undefined);
    if (!activeApp) return true; // No active application, nothing to block
    
    const missingDocs: string[] = [];
    
    if (activeApp.requiredDocuments) {
      activeApp.requiredDocuments.forEach(doc => {
        if (doc.isRequired) {
          const isUploaded = this.activeApplicationDocuments.some(ad => ad.documentTypeId === doc.documentTypeId);
          if (!isUploaded) {
            missingDocs.push(doc.documentTypeName);
          }
        }
      });
    }
    
    if (missingDocs.length > 0) {
      this.notification.warning(`The following required documents are missing: ${missingDocs.join(', ')}. Please upload them before continuing.`);
      return false;
    }
    return true;
  }

  saveStudent(): void {
    this.applyPhoneBeforeSave();
    // Very basic frontend validation checks for required fields
    if (!this.student.firstName || !this.student.lastName || !this.student.schoolId || !this.student.nationalityId) {
      this.notification.warning('Please fill in all required fields (Name, Nationality, School).');
      return;
    }

    if (!this.validateRequiredDocuments()) {
      return;
    }

    this.student.isDraft = false;
    this.submitForm();
  }

  loadStudentHistory(studentId: number): void {
    this.studentProgramService.getHistory(studentId).subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.studentHistory = res.result.map(item => ({
            ...item,
            icon: this.getHistoryIcon(item.title),
            color: this.getHistoryColor(item.title)
          }));
        }
      }
    });
  }

  getHistoryIcon(rawTitle: string): string {
    const title = (rawTitle || '').trim().toLowerCase();
    if (title.includes('academic')) return 'graduation-cap';
    if (title.includes('profile')) return 'user';
    if (title.includes('student') && title.includes('created')) return 'user-plus';
    if (title.includes('document')) return 'upload';
    if (title.includes('application')) return 'check-circle';
    if (title.includes('discussion')) return 'message-circle';
    if (title.includes('registered') || title.includes('created')) return 'user-plus';
    if (title.includes('contact')) return 'user';
    if (title.includes('upload') || title.includes('replaced')) return 'upload';
    if (title.includes('approved')) return 'check-circle';
    if (title.includes('rejected')) return 'x-circle';
    if (title.includes('comment') || title.includes('remark')) return 'message-circle';
    if (title.includes('updated') || title.includes('edit')) return 'edit-2';
    return 'clock';
  }

  getHistoryColor(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('approved') || lowerTitle.includes('completed')) return 'var(--da-success)';
    if (lowerTitle.includes('registered') || lowerTitle.includes('upload') || lowerTitle.includes('applied') || lowerTitle.includes('comment')) return 'var(--da-primary)';
    if (lowerTitle.includes('updated') || lowerTitle.includes('replaced')) return 'var(--da-warning)';
    if (lowerTitle.includes('rejected') || lowerTitle.includes('cancelled')) return 'var(--da-danger)';
    return 'var(--da-muted)';
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

  isApplicationEditable(program: CandidateProgram): boolean {
    return !program.applicationId || program.applicationStatus === StudentStatusEnum.Draft;
  }

  getStatusBadgeClass(program: CandidateProgram): string {
    return this.studentStatusService.getBadgeClass(
      program.applicationStatus ?? StudentStatusEnum.Draft
    );
  }

  getWorkflowStatusMessage(program: CandidateProgram): string {
    switch (program.applicationStatus) {
      case StudentStatusEnum.AcceptanceInProcess:
        return 'This application has been submitted to the University and is currently under review. The School Coordinator can no longer modify this application.';
      case StudentStatusEnum.Accepted:
        return 'The application has been accepted by the University and is awaiting Awarding Review.';
      case StudentStatusEnum.AwardingInProcess:
        return 'The application is currently under Awarding Review by the University.';
      case StudentStatusEnum.Awarded:
        return 'The application has been awarded and forwarded to the Direct Aid Committee for Sponsorship Review.';
      case StudentStatusEnum.Sponsored:
        return 'The application has been approved for sponsorship by the Direct Aid Committee.';
      case StudentStatusEnum.Registered:
        return 'The student has been successfully registered.';
      case StudentStatusEnum.Graduated:
        return 'The student has successfully completed the program.';
      default:
        return 'This application is under University review and can no longer be modified.';
    }
  }



  
}
