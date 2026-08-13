import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { LabelFilterModel } from '../../models/super-admin/labels/label-filter.model';
import { LabelRequestModel } from '../../models/super-admin/labels/label.model';

@Injectable({
    providedIn: 'root'
})
export class LabelService {

    private readonly api = inject(ApiService);

    getLabels(filter: LabelFilterModel) {
        return this.api.post<ApiResponse<PagedResult<LabelRequestModel>>>(
            ApiEndpoints.SuperAdmin.Labels.Search,
            filter
        );
    }

    getLabelById(id: number) {
        return this.api.get<ApiResponse<LabelRequestModel>>(
            ApiEndpoints.SuperAdmin.Labels.GetById(id)
        );
    }

    addLabel(model: LabelRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Labels.Create,
            model
        );
    }

    updateLabel(model: LabelRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Labels.Update(model.labelId!),
            model
        );
    }

    deleteLabel(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Labels.Delete(id)
        );
    }


}