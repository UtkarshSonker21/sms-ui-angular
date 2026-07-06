import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { AppRoutes } from '../../../core/constants/app-routes';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/common/auth.service';
import { LoginRequest } from '../../../core/models/auth/login-request.model';
import { NotificationService } from '../../../core/services/common/notification.service';

import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, MatTooltipModule, DisableAutocompleteDirective],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loginRequest: LoginRequest = new LoginRequest();

  showPassword = false;
  isBusy = false;




  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitted = false;

  onLogin(form: NgForm): void {

    if (form.invalid) {
      return;
    }

    this.submitted = true;
    this.isBusy = true;

    this.authService.login(this.loginRequest).subscribe({

      next: response => {

        this.isBusy = false;
        this.cdr.detectChanges();

        if (!response.success || !response.result) {
          return;
        }

        this.authService.saveLoginData(
          response.result,
          this.loginRequest.rememberMe
        );

        this.authService.loadCurrentUser();
        // load base currency

      },

      error: error => {

        this.isBusy = false;
        this.cdr.detectChanges();

        if (error.status === 401) {
          this.notification.error('Invalid username or password.');
          return;
        }

        this.notification.error('Something went wrong.');
      }

    });

  }


  forgotUsername(): void {
    this.router.navigate([AppRoutes.Common.ForgotUsername]);
  }

  forgotPaswword(): void {
    this.router.navigate([AppRoutes.Common.ForgotPassword]);
  }

  goToSchoolSignup(): void {
    this.router.navigate([AppRoutes.School.Registration]);
  }

  goToUniversitySignup(): void {
    this.router.navigate([AppRoutes.University.Registration]);
  }

  loginWithCode(): void {
    this.router.navigate([AppRoutes.Common.LoginWithCode]);
  }

  googleLogin(): void {
    console.log('Google Login');
  }


}