import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FailingCoreCaseService } from '../../../core/services/ngo/failing-core-case.service';
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

  readonly tabs: { id: CaseTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'denied', label: 'Denied' }
  ];

  cases: FailingCoreCaseModel[] = [];
  activeTab: CaseTab = 'all';
  dataState: CaseDataState = 'loading';
  selectedCase: FailingCoreCaseModel | null = null;
  detailLoading = false;
  detailError = '';
  listError = '';
  decisionComment = '';
  isSavingDecision = false;
  successMessage = '';

  ngOnInit(): void {
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
        if (this.selectedCase) {
          const updatedCase = this.cases.find(item => item.id === this.selectedCase?.id);
          if (updatedCase) this.selectedCase = updatedCase;
        }
      },
      error: error => {
        this.dataState = 'error';
        this.listError = this.errorMessage(error, 'Failing-core cases could not be loaded.');
      }
    });
  }

  openCase(item: FailingCoreCaseModel): void {
    this.selectedCase = item;
    this.detailLoading = true;
    this.detailError = '';
    this.successMessage = '';
    this.decisionComment = '';
    this.casesApi.getById(item.id).subscribe({
      next: response => {
        if (this.selectedCase?.id !== item.id) return;
        this.detailLoading = false;
        if (!response.success || !response.result) {
          this.detailError = response.message || 'Case details could not be loaded.';
          return;
        }
        this.selectedCase = response.result;
      },
      error: error => {
        if (this.selectedCase?.id !== item.id) return;
        this.detailLoading = false;
        this.detailError = this.errorMessage(error, 'Case details could not be loaded.');
      }
    });
  }

  closeCase(): void {
    this.selectedCase = null;
    this.decisionComment = '';
    this.detailError = '';
    this.successMessage = '';
  }

  recordDecision(status: Extract<FailingCoreCaseStatus, 'Approved' | 'Denied'>): void {
    const current = this.selectedCase;
    const comment = this.decisionComment.trim();
    if (!current || current.status !== 'Pending' || this.isSavingDecision) return;
    if (!comment) {
      this.detailError = 'A committee comment is required before saving the decision.';
      return;
    }
    if (comment.length > 2000) {
      this.detailError = 'The committee comment cannot exceed 2,000 characters.';
      return;
    }

    this.isSavingDecision = true;
    this.detailError = '';
    this.successMessage = '';
    this.casesApi.recordDecision(current.id, {
      status,
      comment,
      expectedRowVersion: current.rowVersion
    }).subscribe({
      next: response => {
        this.isSavingDecision = false;
        if (!response.success || !response.result) {
          this.detailError = response.message || 'The decision could not be saved.';
          return;
        }
        this.selectedCase = response.result;
        this.cases = this.cases.map(item => item.id === response.result!.id ? response.result! : item);
        this.dataState = this.filteredCases.length ? 'ready' : 'empty';
        this.successMessage = 'Committee decision recorded successfully.';
      },
      error: error => {
        this.isSavingDecision = false;
        this.detailError = this.errorMessage(error, 'The decision could not be saved. Reload the case before retrying.');
      }
    });
  }

  statusLabel(status: FailingCoreCaseStatus): string {
    if (status === 'Approved') return 'Continuation approved';
    if (status === 'Denied') return 'Continuation denied';
    return 'Pending';
  }

  private errorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as HttpErrorResponse)?.error?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : fallback;
  }
}
