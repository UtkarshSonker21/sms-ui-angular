import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HelperMethods } from '../../../core/helpers/helper-methods';

import { AcademicRegistrationFilterModel } from '../../../core/models/university/academic-registration/academic-registration-filter.model';
import { AcademicRegistrationModel } from '../../../core/models/university/academic-registration/academic-registration.model';
import { RegisterStudentRequestModel } from '../../../core/models/university/academic-registration/register-student-request.model';
import { StudentStatusService } from '../../../core/services/common/student-status.service';
import { StudentStatusEnum } from '../../../core/enums/student-application-status.enum';
import { AcademicRegistrationService } from '../../../core/services/university/academic-registration.service';
import { NotificationService } from '../../../core/services/common/notification.service';

@Component({
  selector: 'app-academic-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './academic-registration.html',
  styleUrl: './academic-registration.scss',
})
export class AcademicRegistration implements OnInit {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private registrationService = inject(AcademicRegistrationService);
  private notification = inject(NotificationService);
  private studentStatusService = inject(StudentStatusService);

  // Table Data
  students: AcademicRegistrationModel[] = [];
  totalRecords = 0;

  // Filter
  filter: AcademicRegistrationFilterModel = new AcademicRegistrationFilterModel();

  // Search
  searchText = '';

  // Pagination Dropdown
  isPageSizeDropdownOpen = false;

  // Registration Dialog State
  showRegisterDialog = false;
  isSaving = false;
  selectedStudent: AcademicRegistrationModel | null = null;
  registerRequest: RegisterStudentRequestModel = new RegisterStudentRequestModel();

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
  }

  loadData(): void {
    this.registrationService.searchAcademicRegistrations(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.students = response.result.items;
          this.totalRecords = response.result.totalCount;

          return;
        }
        this.students = [];
      },
      error: (error) => {
        this.students = [];
        this.notification.handleBusinessError(
          error,
          'Failed to load academic registrations.'
        );
      }
    });
  }

  applySearch(): void {
    this.filter.searchText = this.searchText.trim() || undefined;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  clearSearch(): void {
    this.searchText = '';
    this.filter.searchText = undefined;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applySearch();
    }
  }

  // --- Pagination ---
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.filter.pageSize);
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber === 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }

  previousPage(): void {
    if (!this.isPreviousDisabled) {
      this.filter.pageNumber--;
      this.loadData();
    }
  }

  nextPage(): void {
    if (!this.isNextDisabled) {
      this.filter.pageNumber++;
      this.loadData();
    }
  }

  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
  }

  selectPageSize(size: number): void {
    this.filter.pageSize = size;
    this.filter.pageNumber = 1;
    this.isPageSizeDropdownOpen = false;
    this.loadData();
  }

  // --- Registration Logic ---
  openRegisterDialog(student: AcademicRegistrationModel): void {
    this.selectedStudent = student;
    this.registerRequest = new RegisterStudentRequestModel();
    this.registerRequest.applicationId = student.applicationId;
    this.registerRequest.registrationDate = student.registrationDate ? new Date(student.registrationDate) : new Date();
    this.registerRequest.semesterNo = student.semesterNo || 1;
    this.showRegisterDialog = true;
  }

  closeRegisterDialog(): void {
    this.showRegisterDialog = false;
    this.selectedStudent = null;
  }

  registerStudent(): void {
    if (!this.registerRequest.semesterNo || !this.registerRequest.registrationDate) {
      this.notification.warning('Semester and Registration Date are required.');
      return;
    }

    this.isSaving = true;
    this.registrationService.registerStudent(this.registerRequest).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.notification.success('Student registered successfully.');
          this.closeRegisterDialog();
          this.loadData();

          return;
        } 
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.handleBusinessError(
          error,
          'Failed to register student.'
        );
      }
    });
  }

  // --- Status Badge Helper ---
  getStatusBadgeClass(statusId: number): string {
    return this.studentStatusService.getBadgeClass(statusId || StudentStatusEnum.Sponsored);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  // --- Photo Handling ---
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
}
