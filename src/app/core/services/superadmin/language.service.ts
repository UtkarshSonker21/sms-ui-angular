import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { LanguageFilterModel } from '../../models/super-admin/language/language-filter.model';
import { LanguageRequestModel } from '../../models/super-admin/language/language.model';


@Injectable({
    providedIn: 'root'
})
export class LanguageService {

    private readonly api = inject(ApiService);

    getLanguages(filter: LanguageFilterModel) {
        return this.api.post<ApiResponse<PagedResult<LanguageRequestModel>>>(
            ApiEndpoints.SuperAdmin.Language.Search,
            filter
        );
    }

    getLanguageById(id: number) {
        return this.api.get<ApiResponse<LanguageRequestModel>>(
            ApiEndpoints.SuperAdmin.Language.GetById(id)
        );
    }

    addLanguage(model: LanguageRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Language.Create,
            model
        );
    }

    updateLanguage(model: LanguageRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Language.Update(model.languageId!),
            model
        );
    }

    deleteLanguage(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Language.Delete(id)
        );
    }


}