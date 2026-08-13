import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { LanguageTranslationFilterModel } from '../../models/super-admin/language-translations/language-translation-filter.model';
import { LanguageTranslationRequestModel } from '../../models/super-admin/language-translations/language-translation-request.model';
import { LanguageTranslationManagementModel } from '../../models/super-admin/language-translations/language-translation-management.model';


@Injectable({
    providedIn: 'root'
})
export class LanguageTranslationService {

    private readonly api = inject(ApiService);

    getLanguageTranslationsManagement(filter: LanguageTranslationFilterModel) {
        return this.api.post<ApiResponse<PagedResult<LanguageTranslationManagementModel>>>(
            ApiEndpoints.SuperAdmin.LanguageTranslations.ManagementSearch,
            filter
        );
    }

    getLanguageTranslations(filter: LanguageTranslationFilterModel) {
        return this.api.post<ApiResponse<PagedResult<LanguageTranslationRequestModel>>>(
            ApiEndpoints.SuperAdmin.LanguageTranslations.Search,
            filter
        );
    }

    getLanguageTranslationById(id: number) {
        return this.api.get<ApiResponse<LanguageTranslationRequestModel>>(
            ApiEndpoints.SuperAdmin.LanguageTranslations.GetById(id)
        );
    }

    addLanguageTranslation(model: LanguageTranslationRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.LanguageTranslations.Create,
            model
        );
    }

    updateLanguageTranslation(model: LanguageTranslationRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.LanguageTranslations.Update(model.translationId!),
            model
        );
    }

    deleteLanguageTranslation(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.LanguageTranslations.Delete(id)
        );
    }


}