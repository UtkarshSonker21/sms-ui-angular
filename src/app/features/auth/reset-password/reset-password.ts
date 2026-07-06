import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { AppRoutes } from '../../../core/constants/app-routes';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../core/services/common/auth.service';
import { NotificationService } from '../../../core/services/common/notification.service';
import { ResetPasswordRequest } from '../../../core/models/auth/reset-password-request.model';

import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, CommonModule, DisableAutocompleteDirective],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {

  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  isBusy = false;
  submitted = false;
  showPassword = false;

  resetPasswordRequest: ResetPasswordRequest = new ResetPasswordRequest();

  ngOnInit(): void {

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.notification.error('Invalid or expired reset link.');
      return;
    }

    this.resetPasswordRequest.token = token;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  resetPassword(form: NgForm) {

    this.submitted = true;

    if (form.invalid) {
      return;
    }
    if (!this.resetPasswordRequest.token) {
      this.notification.error('Invalid or expired reset link.');
      return;
    }

    this.isBusy = true;

    this.authService.resetPassword(this.resetPasswordRequest).subscribe({

      next: response => {

        this.isBusy = false;
        this.cdr.detectChanges();

        if (!response.success || !response.result) {
          this.notification.error(response.message);
          return;
        }

        this.notification.success(response.message);
      },

    });

  }


  goBackToLogin(): void {
    this.router.navigate([AppRoutes.Common.Login]);
  }


}
