import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { AppRoutes } from '../../../core/constants/app-routes';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/common/auth.service';
import { NotificationService } from '../../../core/services/common/notification.service';
import { UserIdentifier } from '../../../core/models/auth/user-identifier.model';
import { VerifyOtp } from '../../../core/models/auth/verify-otp.model';

import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';
import { ValidationPatterns } from '../../../core/constants/validation-patterns';

@Component({
  selector: 'app-login-with-code',
  imports: [FormsModule, CommonModule, DisableAutocompleteDirective],
  templateUrl: './login-with-code.html',
  styleUrl: './login-with-code.scss',
})
export class LoginWithCode {


  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  userIdentifier: UserIdentifier = new UserIdentifier();
  validationPatterns = ValidationPatterns;

  isBusy = false;
  submitted = false;
  showOtp = false;
  otpCode = "";

  sendCode(form: NgForm): void {

    if (form.invalid) {
      return;
    }

    this.submitted = true;
    this.isBusy = true;

    this.authService.loginWithCode(this.userIdentifier).subscribe({

      next: response => {
        this.isBusy = false;

        if (!response.success || !response.result) {
          this.notification.error(response.message);
          return;
        }

        this.notification.success(response.message);
        this.showOtp = true;   // Show OTP field

      },
      error: error => {
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });
    this.isBusy = false;

  }



  verifyOtp(form: NgForm) {

    if (this.otpCode === "" || this.otpCode.length != 6) {
      this.notification.error("Please enter a valid 6-digit code.");
      return;
    }

    this.isBusy = true;

    const otp: VerifyOtp = {
      emailOrUsername: this.userIdentifier.emailOrUsername,
      code: this.otpCode
    };

    this.authService.verifyLoginCode(otp).subscribe({

      next: response => {

        this.isBusy = false;

        if (!response.success || !response.result) {
          this.notification.error(response.message);
          return;
        }

        this.notification.success(response.message);
        this.authService.saveLoginData(response.result, true);
        this.authService.loadCurrentUser(true);
      },
      error: error => {
        if (this.notification.handleBusinessError(error)) {
          return;
        }
      }
    });

  }


  goBackToLogin(): void {
    this.router.navigate([AppRoutes.Common.Login]);
  }


}
