import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { LocalizationModel } from '../../models/super-admin/localization/localization.model';


@Injectable({
    providedIn: 'root'
})
export class LocalizationService {

    private readonly api = inject(ApiService);

    getTranslations(languageCode: string) {
        return this.api.get<ApiResponse<LocalizationModel>>(
            ApiEndpoints.SuperAdmin.Localization.GetTranslations(languageCode)
        );
    }

}