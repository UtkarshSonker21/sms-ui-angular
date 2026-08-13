import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocalizationService } from '../../core/services/superadmin/localization.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {

   private readonly localizationService = inject(LocalizationService);

  transform(key: string): string {
    if (!key) {
      return '';
    }

    return this.localizationService.translate(key);
  }
  
}