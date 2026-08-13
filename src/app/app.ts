import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loader } from "./shared/components/loader/loader";
import { LocalizationService } from './core/services/superadmin/localization.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sms-ui');

  private readonly localizationService = inject(LocalizationService);

  ngOnInit(): void {
    this.localizationService.currentLocalization$.subscribe(localization => {
      if (!localization) {
        return;
      }

      document.documentElement.dir = localization.isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = localization.languageCode.toLowerCase();
    });
  }

}
