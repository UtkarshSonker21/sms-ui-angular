import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/common/notification.service';
import { FacultyService } from '../../../core/services/university/faculty.service';
import { FacultyFilter } from '../../../core/models/university/faculties/faculty-filter.model';
import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { AppRoutes } from '../../../core/constants/app-routes';

@Component({
  selector: 'app-faculties-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './faculties-list.html',
  styleUrl: './faculties-list.scss',
})
export class FacultiesList implements OnInit {

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.isPageSizeDropdownOpen = false;
  }

  private facultyService = inject(FacultyService);
  private notification = inject(NotificationService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  private router = inject(Router);

  goBack(): void {
    this.router.navigate([AppRoutes.University.Faculties]);
  }

  faculties: FacultyRequest[] = [];
  totalRecords = 0;
  searchText = '';

  filter = new FacultyFilter();

  ngOnInit(): void {
    this.filter.pageNumber = 1;
    this.filter.pageSize = 25;
    this.loadData();
  }

  loadData(): void {
    this.filter.isActive = true;

    this.facultyService.getFaculties(this.filter).subscribe({
      next: (response) => {
        if (response.success && response.result) {
          this.faculties = response.result.items;
          this.totalRecords = response.result.totalCount;

          return;
        } 
        this.faculties = [];
        this.notification.warning(response.message || 'Failed to load faculties.');
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

  showFacultyModal = false;
  modalErrorMessage = '';
  tempFacultyModel = new FacultyRequest();

  openEditFacultyModal(faculty: FacultyRequest): void {
    this.tempFacultyModel = { ...faculty };
    this.modalErrorMessage = '';
    this.showFacultyModal = true;
  }

  saveFaculty(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const user = this.currentUserProfileService.getCurrentUserProfile();
    if (user?.universityIds?.length) {
      this.tempFacultyModel.universityId = user.universityIds[0];
    }

    const request = this.tempFacultyModel.facultyId
      ? this.facultyService.updateFaculty(this.tempFacultyModel)
      : this.facultyService.addFaculty(this.tempFacultyModel);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.tempFacultyModel.facultyId ? 'Faculty updated successfully' : 'Faculty created successfully');
          this.showFacultyModal = false;
          this.loadData();
          return;
        }
        this.notification.error(response.message || 'Failed to save faculty');
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to save faculty.'
        );
      }
    });
  }

  facultyToDelete?: FacultyRequest;
  showDeleteModal = false;

  openDeleteFacultyModal(faculty: FacultyRequest): void {
    this.facultyToDelete = faculty;
    this.showDeleteModal = true;
  }

  confirmDeleteFaculty(): void {
    if (!this.facultyToDelete?.facultyId) {
      return;
    }

    this.facultyService.deleteFaculty(this.facultyToDelete.facultyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Faculty deleted successfully');
          this.showDeleteModal = false;
          this.loadData();

          return;
        }
        this.notification.error(response.message || 'Failed to delete faculty.');
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to delete faculty.'
        );
      }
    });
  }


}
