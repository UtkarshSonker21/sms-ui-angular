import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HelperMethods } from '../../helpers/helper-methods';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string, action: string = 'Success', duration: number = 5000): void {
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
    });
  }

  error(message: string, action: string = 'Error', duration: number = 6000): void {
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-error']
    });
  }

  warning(message: string, action: string = 'Warning', duration: number = 6000): void {
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-warning']
    });
  }

  info(message: string, action: string = 'Info', duration: number = 5000): void {
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-info']
    });
  }



  // for warning messages from api resposne 
  handleBusinessError(error: any, customMessage?: string): boolean {

    const message = customMessage ?? HelperMethods.getApiErrorMessage(error);

    if (error?.status === 400) {
      this.warning(message);
      return true;
    }

    if (error?.status === 404) {
      this.error(message);
      return true;
    }

    return false;
  }


}