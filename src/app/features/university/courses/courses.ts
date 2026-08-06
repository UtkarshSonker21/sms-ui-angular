import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';

import { CourseService } from '../../../core/services/university/course.service';
import { CourseFilter } from '../../../core/models/university/courses/course-filter.model';
import { CourseRequest } from '../../../core/models/university/courses/course-request.model';

import { FacultyService } from '../../../core/services/university/faculty.service';
import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { FacultyFilter } from '../../../core/models/university/faculties/faculty-filter.model';

import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';


@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './courses.html',
  styleUrl: './courses.scss',
})
export class Courses implements OnInit {

  // close all dropdown on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
    this.isFacultyDropdownOpen = false;
    this.isMultiSelectDropdownOpen = false;
  }

  private facultyService = inject(FacultyService);
  private courseService = inject(CourseService);
  private notification = inject(NotificationService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private router = inject(Router);


  // Table
  courses: CourseRequest[] = [];
  totalRecords = 0;
  searchText = '';

  // Filter
  filter = new CourseFilter();

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;

    this.getFaculties();
    this.loadData();
  }

  loadData(): void {

    this.filter.isActive = true;

    this.filter.facultyId = this.selectedFaculty || undefined;

    this.courseService.getCourses(this.filter).subscribe({

      next: (response) => {

        if (response.success && response.result) {
          this.courses = response.result.items;
          this.totalRecords = response.result.totalCount;
          // this.cdr.detectChanges();
        } else {
          this.courses = [];
          this.notification.warning(response.message);
        }

      },

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


  // pagesize dropdown
  isPageSizeDropdownOpen = false;

  togglePageSizeDropdown(event: Event): void {
    event.stopPropagation();
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
  }

  selectPageSize(size: number): void {
    this.isPageSizeDropdownOpen = false;
    this.onPageSizeChange(size);
  }

  onPageSizeChange(size: number): void {
    this.filter.pageSize = size;
    this.filter.pageNumber = 1;
    this.loadData();
  }

  previousPage(): void {
    if (this.filter.pageNumber > 1) {
      this.filter.pageNumber--;
      this.loadData();
    }
  }

  nextPage(): void {
    if (this.filter.pageNumber < this.totalPages) {
      this.filter.pageNumber++;
      this.loadData();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.filter.pageSize);
  }

  get isPreviousDisabled(): boolean {
    return this.filter.pageNumber <= 1;
  }

  get isNextDisabled(): boolean {
    return this.filter.pageNumber >= this.totalPages;
  }


  // faculty Dropdown
  selectedFaculty = 0;
  faculties: FacultyRequest[] = [];
  isFacultyDropdownOpen = false;

  toggleFacultyDropdown(event: Event): void {
    event.stopPropagation();
    this.isFacultyDropdownOpen = !this.isFacultyDropdownOpen;
  }

  selectFacultyOption(facultyId: number | undefined): void {
    this.selectedFaculty = facultyId || 0;
    this.isFacultyDropdownOpen = false;
    this.loadData();
  }

  clearFacultySelection(event: Event): void {
    event.stopPropagation();
    this.selectedFaculty = 0;
    this.loadData();
  }

  getSelectedFacultyName(): string {
    if (this.selectedFaculty === 0) {
      return 'All Faculties';
    }
    const found = this.faculties.find(f => f.facultyId === this.selectedFaculty);
    return found ? found.facultyName : 'All Faculties';
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
          //this.cdr.detectChanges();
        }
        else {
          this.notification.warning(response.message);;
        }

      },

    });

  }



  showCourseModal = false;
  isMultiSelectDropdownOpen = false;
  modalErrorMessage = '';
  tempCourseModel = new CourseRequest();


  toggleMultiSelectDropdown(event: Event): void {
    event.stopPropagation();
    this.isMultiSelectDropdownOpen = !this.isMultiSelectDropdownOpen;
  }

  isFacultySelected(id: number | undefined): boolean {
    if (!id) return false;
    return this.tempCourseModel.facultyIds.includes(id);
  }

  toggleFacultySelection(id: number | undefined): void {
    if (!id) return;
    const index = this.tempCourseModel.facultyIds.indexOf(id);
    if (index > -1) {
      this.tempCourseModel.facultyIds.splice(index, 1);
    } else {
      this.tempCourseModel.facultyIds.push(id);
    }
  }

  getSelectedFaculties(): FacultyRequest[] {
    return this.faculties.filter(f => f.facultyId && this.tempCourseModel.facultyIds.includes(f.facultyId));
  }

  openAddCourseModal(): void {
    this.tempCourseModel = new CourseRequest();
    this.tempCourseModel.facultyIds = [];
    this.modalErrorMessage = '';
    this.showCourseModal = true;
    this.isMultiSelectDropdownOpen = false;
  }

  openEditCourseModal(course: CourseRequest): void {
    this.tempCourseModel = {
      ...course,
      facultyIds: course.faculties ? course.faculties.map(f => f.facultyId) : []
    };
    this.modalErrorMessage = '';
    this.showCourseModal = true;
    this.isMultiSelectDropdownOpen = false;
  }


  saveCourse(form: NgForm): void {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const user = this.currentUserProfileService.getCurrentUserProfile();
    // if (user?.universityId) {
    //   this.tempCourseModel.universityId = user.universityId;
    // }

    if (user?.universityIds?.length) {
      this.tempCourseModel.universityId = user.universityIds[0];
    }

    const request = this.tempCourseModel.courseId
      ? this.courseService.updateCourse(this.tempCourseModel)
      : this.courseService.addCourse(this.tempCourseModel);

    request.subscribe({

      next: () => {
        this.notification.success(this.tempCourseModel.courseId ? 'Course updated successfully' : 'Course added successfully');
        this.showCourseModal = false;
        this.loadData();
      },

      error: err => {
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        }
      }

    });
  }

  courseToDelete?: CourseRequest;
  showDeleteModal = false;

  openDeleteCourseModal(course: CourseRequest): void {
    this.courseToDelete = course;
    this.showDeleteModal = true;
  }

  confirmDeleteCourse(): void {
    if (!this.courseToDelete?.courseId) {
      return;
    }

    this.courseService.deleteCourse(this.courseToDelete.courseId).subscribe({

      next: () => {
        this.notification.success('Course deleted successfully');
        this.showDeleteModal = false;
        this.loadData();
      },

      error: err => {
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        }
      }

    });
  }


}
