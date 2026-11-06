import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FailingCoreCaseService } from '../../../core/services/ngo/failing-core-case.service';
import { StudentProgramService } from '../../../core/services/school/student-program.service';
import {
  FailingCoreCaseModel,
  FailingCoreCaseStatus
} from '../../../core/models/ngo/failing-core-cases/failing-core-case.model';

type CaseTab = 'all' | 'pending' | 'approved' | 'denied';
type CaseDataState = 'loading' | 'error' | 'empty' | 'ready';

@Component({
  selector: 'app-failing-core-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './failing-core-cases.html',
  styleUrl: './failing-core-cases.scss',
})
export class FailingCoreCases implements OnInit {
  private readonly casesApi = inject(FailingCoreCaseService);
  private readonly studentProgramService = inject(StudentProgramService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tabs: { id: CaseTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'denied', label: 'Denied' }
  ];

  cases: FailingCoreCaseModel[] = [];
  activeTab: CaseTab = 'all';
  dataState: CaseDataState = 'loading';
  listError = '';
  readonly categoryMap = new Map<number, string>();

  ngOnInit(): void {
    const directCaseId = Number(this.route.snapshot.queryParams['caseId']);
    if (Number.isSafeInteger(directCaseId) && directCaseId > 0) {
      this.router.navigate(['/failing-core-cases', directCaseId], { replaceUrl: true });
      return;
    }
    this.loadCases();
  }

  get filteredCases(): FailingCoreCaseModel[] {
    if (this.activeTab === 'all') return this.cases;
    return this.cases.filter(item => item.status.toLowerCase() === this.activeTab);
  }

  get pendingCount(): number {
    return this.cases.filter(item => item.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.cases.filter(item => item.status === 'Approved').length;
  }

  get deniedCount(): number {
    return this.cases.filter(item => item.status === 'Denied').length;
  }

  setTab(tab: CaseTab): void {
    this.activeTab = tab;
    this.dataState = this.filteredCases.length ? 'ready' : 'empty';
  }

  loadCases(): void {
    this.dataState = 'loading';
    this.listError = '';
    this.casesApi.getAll().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.result)) {
          this.dataState = 'error';
          this.listError = response.message || 'Failing-core cases could not be loaded.';
          return;
        }
        this.cases = response.result;
        this.dataState = this.filteredCases.length ? 'ready' : 'empty';
        this.loadCategoriesForCases(this.cases);
      },
      error: error => {
        this.dataState = 'error';
        this.listError = this.errorMessage(error, 'Failing-core cases could not be loaded.');
      }
    });
  }

  private loadCategoriesForCases(cases: FailingCoreCaseModel[]): void {
    const appIdsToFetch = Array.from(
      new Set(
        cases
          .filter(c => !c.categoryName && c.applicationId && !this.categoryMap.has(c.applicationId))
          .map(c => c.applicationId)
      )
    );

    if (appIdsToFetch.length === 0) return;

    forkJoin(
      appIdsToFetch.map(appId =>
        this.studentProgramService.getById(appId).pipe(
          map(res => ({
            appId,
            categoryName: res?.success && res.result ? (res.result.categoryName || res.result.sponsorshipCategoryName || '') : ''
          })),
          catchError(() => of({ appId, categoryName: '' }))
        )
      )
    ).subscribe(results => {
      for (const item of results) {
        if (item.categoryName) {
          this.categoryMap.set(item.appId, item.categoryName);
        }
      }
    });
  }

  getCategory(item: FailingCoreCaseModel): string {
    if (item.categoryName) return item.categoryName;
    if (item.applicationId && this.categoryMap.has(item.applicationId)) {
      return this.categoryMap.get(item.applicationId) || '—';
    }
    return '—';
  }

  viewCase(id: number): void {
    this.router.navigate(['/failing-core-cases', id]);
  }

  statusLabel(status: FailingCoreCaseStatus): string {
    if (status === 'Approved') return 'Continuation approved';
    if (status === 'Denied') return 'Continuation denied';
    return 'Pending';
  }

  getStatusChipClass(status: FailingCoreCaseStatus): string {
    switch (status) {
      case 'Approved':
        return 'chip-sponsored';
      case 'Denied':
        return 'chip-rejected';
      case 'Pending':
      default:
        return 'chip-pending';
    }
  }

  getStatusDotColor(status: FailingCoreCaseStatus): string {
    switch (status) {
      case 'Approved':
        return 'var(--da-green)';
      case 'Denied':
        return 'var(--da-danger)';
      case 'Pending':
      default:
        return 'var(--da-gold)';
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as HttpErrorResponse)?.error?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : fallback;
  }
}
