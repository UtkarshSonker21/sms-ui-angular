import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '440px',
      maxWidth: '95vw',
      panelClass: 'confirm-dialog-overlay-panel',
      autoFocus: false,
      restoreFocus: false,
      disableClose: false,
    });

    return firstValueFrom(dialogRef.afterClosed()).then((result) => !!result);
  }
}
