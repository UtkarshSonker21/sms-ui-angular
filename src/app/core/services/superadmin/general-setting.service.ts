import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { GeneralSettingFilterModel } from '../../models/super-admin/general-setting/general-setting-filter.model';
import { GeneralSettingModel } from '../../models/super-admin/general-setting/general-setting.model';


@Injectable({
    providedIn: 'root'
})
export class GeneralSettingService {

    private readonly api = inject(ApiService);

    getGeneralSettings(filter: GeneralSettingFilterModel) {
        return this.api.post<ApiResponse<PagedResult<GeneralSettingModel>>>(
            ApiEndpoints.SuperAdmin.GeneralSettings.Search,
            filter
        );
    }

    getGeneralSettingById(id: number) {
        return this.api.get<ApiResponse<GeneralSettingModel>>(
            ApiEndpoints.SuperAdmin.GeneralSettings.GetById(id)
        );
    }

    addGeneralSetting(model: GeneralSettingModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.GeneralSettings.Create,
            model
        );
    }

    updateGeneralSetting(model: GeneralSettingModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.GeneralSettings.Update(model.configId!),
            model
        );
    }

    deleteGeneralSetting(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.GeneralSettings.Delete(id)
        );
    }


}