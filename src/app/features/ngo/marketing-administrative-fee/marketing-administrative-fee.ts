import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketingAdministrativeFeeService } from '../../../core/services/common/marketing-administrative-fee.service';
import { MarketingAdministrativeFeeResponse } from '../../../core/models/common/marketing-administrative-fee/marketing-administrative-fee-response.model';
import { MarketingAdministrativeFeeRequest } from '../../../core/models/common/marketing-administrative-fee/marketing-administrative-fee-request.model';
import { MarketingAdministrativeFeeHistory } from '../../../core/models/common/marketing-administrative-fee/marketing-administrative-fee-history.model';
import { ApiResponse } from '../../../core/models/common/response/api-response.model';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../core/services/common/notification.service';

@Component({
  selector: 'app-marketing-administrative-fee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marketing-administrative-fee.html',
  styleUrl: './marketing-administrative-fee.scss',
  providers: [DatePipe]
})
export class MarketingAdministrativeFee implements OnInit {
  private readonly feeService = inject(MarketingAdministrativeFeeService);
  private readonly datePipe = inject(DatePipe);
  private readonly notification = inject(NotificationService);

  feePercentage: number | null = null;
  currentValueInfo: MarketingAdministrativeFeeResponse | null = null;
  
  isLoading = false;
  isSaving = false;
  successMessage = '';
  validationError = '';

  showHistory = false;
  history: MarketingAdministrativeFeeHistory[] = [];
  isLoadingHistory = false;
  isHistoryLoaded = false;

  ngOnInit(): void {
    this.loadCurrentFee();
  }

  loadCurrentFee(): void {
    this.isLoading = true;
    this.feeService.getCurrent()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: ApiResponse<MarketingAdministrativeFeeResponse>) => {
          if (res.success && res.result) {
            this.currentValueInfo = res.result;
            this.feePercentage = res.result.feePercentage;
          }
        },
        error: (error) => {
          this.notification.handleBusinessError(
            error,
            'Failed to load fee settings.'
          );
        }
      });
  }

  saveFee(): void {
    this.validationError = '';
    this.successMessage = '';

    if (this.feePercentage === null || this.feePercentage === undefined || this.feePercentage.toString().trim() === '') {
      this.validationError = 'Please enter a percentage.';
      return;
    }

    const val = Number(this.feePercentage);
    if (isNaN(val) || val < 0 || val > 100) {
      this.validationError = 'Value must be a number between 0 and 100.';
      return;
    }

    const request: MarketingAdministrativeFeeRequest = {
      feePercentage: val
    };

    this.isSaving = true;
    this.feeService.update(request)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: (res: ApiResponse<boolean>) => {
          if (res.success) {
            this.successMessage = 'Saved.';
            this.loadCurrentFee();
            if (this.showHistory) {
              this.loadHistory(); // Refresh history if panel is open
            }
            setTimeout(() => this.successMessage = '', 2500);
          } else {
            this.validationError = res.message || 'Failed to update fee.';
          }
        },
        error: (error) => {
          this.notification.handleBusinessError(
            error,
            'Failed to save fee settings.'
          );
        }
      });
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
    if (this.showHistory && !this.isHistoryLoaded) {
      this.loadHistory();
    }
  }

  private loadHistory(): void {
    this.isLoadingHistory = true;
    this.feeService.getHistory()
      .pipe(finalize(() => this.isLoadingHistory = false))
      .subscribe({
        next: (res: ApiResponse<MarketingAdministrativeFeeHistory[]>) => {
          if (res.success && res.result) {
            this.history = res.result;
            this.isHistoryLoaded = true;
          }
        },
        error: (error) => {
          this.notification.handleBusinessError(
            error,
            'Failed to load fee history.'
          );
        }
      });
  }

  get formattedLastUpdated(): string {
    if (!this.currentValueInfo || this.currentValueInfo.feePercentage == null) {
      return 'No value saved yet. The system default of 0% applies until set.';
    }
    
    const value = Number(this.currentValueInfo.feePercentage).toFixed(1).replace(/\.0$/, '') + '%';
    const date = this.currentValueInfo.updatedDate || this.currentValueInfo.createdDate;
    const formattedDate = date ? this.datePipe.transform(date, 'yyyy-MM-dd') : '—';
    const by = this.currentValueInfo.updatedByName || this.currentValueInfo.createdByName;
    
    let text = `<b class="num-ltr">${value}</b> · last updated <span class="num-ltr">${formattedDate}</span>`;
    if (by) {
      text += ` by ${by}`;
    }
    return text;
  
  }


  
}
