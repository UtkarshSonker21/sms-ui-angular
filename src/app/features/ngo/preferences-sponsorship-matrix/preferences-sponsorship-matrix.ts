import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SponsorshipMatrixService } from '../../../core/services/ngo/sponsorship-matrix.service';
import { SponsorshipMatrix } from '../../../core/models/ngo/sponsorshipMatrix/sponsorship-matrix.model';
import { SponsorshipTypeService } from '../../../core/services/ngo/sponsorship-type.service';
import { StudentCategoryService } from '../../../core/services/ngo/student-category.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { SponsorshipTypeRequest } from '../../../core/models/ngo/sponsorship-type/sponsorship-type-request.model';
import { StudentCategoryRequest } from '../../../core/models/ngo/student-category/student-category.request.model';
import { NotificationService } from '../../../core/services/common/notification.service';

@Component({
  selector: 'app-preferences-sponsorship-matrix',
  imports: [CommonModule, FormsModule],
  templateUrl: './preferences-sponsorship-matrix.html',
  styleUrl: './preferences-sponsorship-matrix.scss',
})
export class PreferencesSponsorshipMatrix implements OnInit {
  private readonly matrixService = inject(SponsorshipMatrixService);
  private readonly sponsorshipTypeService = inject(SponsorshipTypeService);
  private readonly studentCategoryService = inject(StudentCategoryService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly notification = inject(NotificationService);

  matrixData: SponsorshipMatrix | null = null;
  searchText: string = '';
  loadingStates: { [key: string]: boolean } = {};

  // Modals state
  showSponsorshipModal = false;
  isEditingSponsorshipMode = false;
  editingSponsorship: SponsorshipTypeRequest = new SponsorshipTypeRequest();
  
  showCategoryModal = false;
  isEditingCategoryMode = false;
  editingCategory: StudentCategoryRequest = new StudentCategoryRequest();

  get kpiSponsorshipTypes(): number {
    return this.matrixData?.sponsorshipTypes?.length || 0;
  }

  get kpiStudentCategories(): number {
    return this.matrixData?.studentCategories?.length || 0;
  }

  get kpiActiveCells(): number {
    return this.matrixData?.mappings?.filter(m => m.isActive).length || 0;
  }

  get kpiCoverage(): string {
    const totalCells = this.kpiSponsorshipTypes * this.kpiStudentCategories;
    const activeCells = this.kpiActiveCells;
    const coverage = totalCells === 0 ? 0 : Math.round((activeCells / totalCells) * 100);
    return `${coverage}%`;
  }

  ngOnInit(): void {
    this.loadMatrix();
  }

  loadMatrix(): void {
    this.matrixService.getMatrix().subscribe({
      next: (res) => {
        if (res.success && res.result) {
          this.matrixData = res.result;
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to load sponsorship matrix.'
        );
      }
    });
  }

  resetToDefaults(): void {
    console.log('Reset to defaults clicked');
    // Implement API call for reset when available
  }

  get filteredTypes() {
    if (!this.matrixData?.sponsorshipTypes) return [];
    if (!this.searchText) return this.matrixData.sponsorshipTypes;
    const lowerSearch = this.searchText.toLowerCase();
    return this.matrixData.sponsorshipTypes.filter(t => 
      t.sponsorshipName.toLowerCase().includes(lowerSearch)
    );
  }

  get filteredCategories() {
    if (!this.matrixData?.studentCategories) return [];
    return this.matrixData.studentCategories;
  }

  isMapped(typeId: number, categoryId: number): boolean {
    if (!this.matrixData?.mappings) return false;
    const mapping = this.matrixData.mappings.find(m => m.sponsorshipTypeId === typeId && m.studentCategoryId === categoryId);
    return mapping ? mapping.isActive : false;
  }

  toggleMapping(typeId: number, categoryId: number, event: Event): void {
    // Prevent default to rely on our optimistic update / server response
    event.preventDefault();
    
    const key = `${typeId}-${categoryId}`;
    if (this.loadingStates[key]) return;

    this.loadingStates[key] = true;

    this.matrixService.toggle({ sponsorshipTypeId: typeId, studentCategoryId: categoryId }).subscribe({
      next: (res) => {
        if (res.success) {
          // Toggle local state
          if (this.matrixData && this.matrixData.mappings) {
            const mapping = this.matrixData.mappings.find(m => m.sponsorshipTypeId === typeId && m.studentCategoryId === categoryId);
            if (mapping) {
              mapping.isActive = !mapping.isActive;
            } else {
              this.matrixData.mappings.push({
                sponsorshipTypeId: typeId,
                studentCategoryId: categoryId,
                isActive: true
              });
            }
          }
        }
        this.loadingStates[key] = false;
      },
      error: (error) => {
        this.loadingStates[key] = false;
        this.notification.handleBusinessError(
          error,
          'Failed to update mapping.'
        );
      }
    });
  }

  // --- Sponsorship Type Actions ---
  openSponsorshipModal(id?: number): void {
    if (id) {
      this.isEditingSponsorshipMode = true;
      this.sponsorshipTypeService.getSponsorshipTypeById(id).subscribe({
        next: (res) => {
          if (res.success && res.result) {
            this.editingSponsorship = res.result;
            this.showSponsorshipModal = true;
          }
        },
        error: (error) => {
          this.notification.handleBusinessError(
            error,
            'Failed to load sponsorship type details.'
          );
        }
      });
    } else {
      this.isEditingSponsorshipMode = false;
      this.editingSponsorship = new SponsorshipTypeRequest();
      this.showSponsorshipModal = true;
    }
  }

  saveSponsorship(form: any): void {
    if (form.invalid || !this.editingSponsorship.frequencyType) return;
    
    const saveObservable = this.isEditingSponsorshipMode
      ? this.sponsorshipTypeService.updateSponsorshipType(this.editingSponsorship)
      : this.sponsorshipTypeService.addSponsorshipType(this.editingSponsorship);

    saveObservable.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(
            this.isEditingSponsorshipMode
              ? 'Sponsorship type updated successfully.'
              : 'Sponsorship type created successfully.'
          );
          this.showSponsorshipModal = false;
          this.loadMatrix();
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to save sponsorship type.'
        );
      }
    });
  }

  deleteSponsorship(id: number): void {
    this.confirmDialogService.confirm({
      title: 'Delete Sponsorship Type',
      message: 'Are you sure you want to delete this sponsorship type?'
    }).then((confirmed) => {
      if (confirmed) {
        this.sponsorshipTypeService.deleteSponsorshipType(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Sponsorship type deleted successfully.');
              this.loadMatrix();
            }
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to delete sponsorship type.'
            );
          }
        });
      }
    });
  }

  // --- Student Category Actions ---
  openCategoryModal(id?: number): void {
    if (id) {
      this.isEditingCategoryMode = true;
      this.studentCategoryService.getStudentCategoryById(id).subscribe({
        next: (res) => {
          if (res.success && res.result) {
            this.editingCategory = res.result;
            this.showCategoryModal = true;
          }
        },
        error: (error) => {
          this.notification.handleBusinessError(
            error,
            'Failed to load student category details.'
          );
        }
      });
    } else {
      this.isEditingCategoryMode = false;
      this.editingCategory = new StudentCategoryRequest();
      this.showCategoryModal = true;
    }
  }

  saveCategory(form: any): void {
    if (form.invalid) return;

    const saveObservable = this.isEditingCategoryMode
      ? this.studentCategoryService.updateStudentCategory(this.editingCategory)
      : this.studentCategoryService.addStudentCategory(this.editingCategory);

    saveObservable.subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(
            this.isEditingCategoryMode
              ? 'Student category updated successfully.'
              : 'Student category created successfully.'
          );
          this.showCategoryModal = false;
          this.loadMatrix();
        }
      },
      error: (error) => {
        this.notification.handleBusinessError(
          error,
          'Failed to save student category.'
        );
      }
    });
  }

  deleteCategory(id: number): void {
    this.confirmDialogService.confirm({
      title: 'Delete Student Category',
      message: 'Are you sure you want to delete this category?'
    }).then((confirmed) => {
      if (confirmed) {
        this.studentCategoryService.deleteStudentCategory(id).subscribe({
          next: (res) => {
            if (res.success) {
              this.notification.success('Student category deleted successfully.');
              this.loadMatrix();
            }
          },
          error: (error) => {
            this.notification.handleBusinessError(
              error,
              'Failed to delete student category.'
            );
          }
        });
      }
    });
  }
}
