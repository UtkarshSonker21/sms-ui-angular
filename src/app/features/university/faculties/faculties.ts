import { Component, inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';


import { AppRoutes } from '../../../core/constants/app-routes';
import { FacultyService } from '../../../core/services/university/faculty.service';
import { NotificationService } from '../../../core/services/common/notification.service';

import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { HelperMethods } from '../../../core/helpers/helper-methods';
import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { FacultyProgramsDashboard } from '../../../core/models/university/faculties/faculty-program-dashboard.model';
import { StaffType } from '../../../core/enums/staff-type.enum';


import { FacultyRequest } from '../../../core/models/university/faculties/faculty-request.model';
import { FacultyProgramItem } from '../../../core/models/university/faculties/faculty-program-item.model';

@Component({
  selector: 'app-faculties',
  standalone: true,
  imports: [CommonModule, FormsModule, DisableAutocompleteDirective],
  templateUrl: './faculties.html',
  styleUrl: './faculties.scss',
})
export class Faculties implements OnInit {

  // close all dropdown on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
  }

  private router = inject(Router);
  private facultyService = inject(FacultyService);
  private notification = inject(NotificationService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  currentStaffType!: StaffType;

  ngOnInit(): void {
    const user = this.currentUserProfileService.getCurrentUserProfile();
    this.currentStaffType = user?.staffType;

    if (
      this.currentStaffType === StaffType.University &&
      user?.universityId
    ) {
      this.loadFacultyPrograms(user.universityId);
    }
  }


  dashboardData: FacultyProgramsDashboard = new FacultyProgramsDashboard();

  loadFacultyPrograms(universityId: number): void {

    this.facultyService.getFacultyPrograms(universityId).subscribe({

      next: (response) => {
        if (response.success && response.result) {
          this.dashboardData = response.result;
        } else {
          this.dashboardData = new FacultyProgramsDashboard();
          this.notification.warning(response.message);
        }
      },

    });
  }



  selectedFacultyFilter = 0;

  selectFacultyFilter(id: number): void {
    this.selectedFacultyFilter = id;
  }

  getFilteredFaculties(): any[] {
    if (!this.dashboardData.faculties) return [];
    if (this.selectedFacultyFilter === 0) {
      return this.dashboardData.faculties;
    }
    return this.dashboardData.faculties.filter(f => f.facultyId === this.selectedFacultyFilter);
  }


  addProgram(): void {
    this.router.navigate([AppRoutes.University.Programs]);
  }

  showFacultyModal = false;
  tempFacultyModel: FacultyRequest = new FacultyRequest();
  modalErrorMessage = '';

  addFaculty(): void {
    this.tempFacultyModel = new FacultyRequest();
    this.modalErrorMessage = '';
    this.showFacultyModal = true;
  }

  openEditFacultyModal(faculty: any): void {
    this.tempFacultyModel = {
      facultyId: faculty.facultyId,
      facultyName: faculty.facultyName,
      facultyCode: faculty.facultyCode || '',
      isActive: faculty.isActive ?? true,
      universityId: faculty.universityId || 0
    };
    this.modalErrorMessage = '';
    this.showFacultyModal = true;
  }

  saveFaculty(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const user = this.currentUserProfileService.getCurrentUserProfile();
    if (user?.universityId) {
      this.tempFacultyModel.universityId = user.universityId;
    }

    const request = this.tempFacultyModel.facultyId
      ? this.facultyService.updateFaculty(this.tempFacultyModel)
      : this.facultyService.addFaculty(this.tempFacultyModel);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.tempFacultyModel.facultyId ? 'Faculty updated successfully' : 'Faculty created successfully');
          this.showFacultyModal = false;
          if (user?.universityId) {
            this.loadFacultyPrograms(user.universityId);
          }
        } else {
          this.modalErrorMessage = response.message || 'Failed to save faculty';
          this.notification.error(response.message || 'Failed to save faculty');
        }
      },
      error: (err) => {
        if (HelperMethods.isBusinessError(err)) {
          this.modalErrorMessage = HelperMethods.getApiErrorMessage(err);
        } else {
          this.modalErrorMessage = 'An unexpected error occurred.';
        }
        this.notification.error(this.modalErrorMessage);
      }
    });
  }

  editProgram(programId: number, isDraft: boolean): void {

    this.router.navigate([
      isDraft
        ? AppRoutes.University.Programs
        : AppRoutes.University.ProgramDetail,
      programId
    ]);

  }

  // goToProgramDetail(programId: number): void {
  //   this.router.navigate([
  //     AppRoutes.University.ProgramDetail,
  //     programId
  //   ]);
  // }


  getFacultyIconPath(name: string): string {

    const value = name.toLowerCase();

    if (value.includes('medicine')) {

      return `<path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />`;

    }

    if (value.includes('engineering')) {

      return `<path d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m3 0h5m0 0V11m0 10V11m0-4h.01M10 7h.01M6 11h.01M6 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01M6 7h.01M14 7h.01' />`;

    }

    if (value.includes('business')) {

      return `<path d='M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3' />`;

    }

    return `<path d='M20.37 8.91l-8.17-8.17a3 3 0 00-4.25 0L1.76 6.93a3 3 0 000 4.25l8.17 8.17a3 3 0 004.25 0l6.19-6.19a3 3 0 000-4.25zM6 10a1 1 0 110-2 1 1 0 010 2z' />`;

  }


  getTabLabel(name: string): string {
    return name.replace(/Faculty of /gi, '').trim();
  }

  getFacultyIconClass(name: string): string {
    const value = name.toLowerCase();
    if (value.includes('business')) return 'fas fa-briefcase';
    if (value.includes('engineering')) return 'fas fa-gears';
    if (value.includes('technology') || value.includes('computer')) return 'fas fa-laptop-code';
    if (value.includes('law')) return 'fas fa-scale-balanced';
    if (value.includes('medicine') || value.includes('nursing') || value.includes('pharmacy')) return 'fas fa-staff-snake';
    if (value.includes('education')) return 'fas fa-graduation-cap';
    if (value.includes('science')) return 'fas fa-flask';
    if (value.includes('arts')) return 'fas fa-palette';
    if (value.includes('agriculture')) return 'fas fa-seedling';
    if (value.includes('economics')) return 'fas fa-coins';
    return 'fas fa-graduation-cap';
  }

}
