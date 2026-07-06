import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { AppRoutes } from '../../../core/constants/app-routes';

import { AuthService } from '../../../core/services/common/auth.service';
import { UserIdentifier } from '../../../core/models/auth/user-identifier.model';
import { NotificationService } from '../../../core/services/common/notification.service';

import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-forgot-username',
  imports: [FormsModule, CommonModule, DisableAutocompleteDirective],
  templateUrl: './forgot-username.html',
  styleUrl: './forgot-username.scss',
})
export class ForgotUsername {

  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userIdentifier : UserIdentifier = new UserIdentifier();

  isBusy = false;


  submitted = false;

  sendUsername(form: NgForm): void {

    if (form.invalid) {
      return;
    }

    this.submitted = true;
    this.isBusy = true;

    this.authService.forgotUsername(this.userIdentifier).subscribe({

      next: response => {

        this.isBusy = false;
        this.cdr.detectChanges();

        if (!response.success || !response.result) {
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
