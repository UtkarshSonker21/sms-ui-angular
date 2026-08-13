import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { LocalizationModel } from '../../models/super-admin/localization/localization.model';

@Injectable({
    providedIn: 'root'
})
export class LocalizationService {

    private readonly api = inject(ApiService);

    private currentLocalizationSubject = new BehaviorSubject<LocalizationModel | null>(null);
    currentLocalization$ = this.currentLocalizationSubject.asObservable();

    private translations: Record<string, string> = {};

    getTranslations(languageCode: string) {
        return this.api.get<ApiResponse<LocalizationModel>>(
            ApiEndpoints.SuperAdmin.Localization.GetTranslations(languageCode)
        );
    }

    loadTranslations(languageCode: string) {
        return this.getTranslations(languageCode).pipe(
            tap(response => {
                if (response.success && response.result) {
                    this.translations = response.result.translations;
                    this.currentLocalizationSubject.next(response.result);
                }
            })
        );
    }

    translate(key: string): string {
        return this.translations[key] ?? key;
    }

    get isRTL(): boolean {
        return this.currentLocalizationSubject.value?.isRTL ?? false;
    }

}