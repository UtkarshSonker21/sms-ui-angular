import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';

import { MasterUniversityRequest } from '../../models/university/master-university/university-registration.model';
import { MasterUniversityFilter } from '../../models/university/master-university/university-registration-filter.model';



@Injectable({
    providedIn: 'root'
})
export class MasterUniversityService {

    private readonly api = inject(ApiService);

    getMasterUniversities(filter: MasterUniversityFilter) {
        return this.api.post<ApiResponse<PagedResult<MasterUniversityRequest>>>(
            ApiEndpoints.University.MasterUniversity.Search,
            filter
        );
    }

    getMasterUniversityById(id: number) {
        return this.api.get<ApiResponse<MasterUniversityRequest>>(
            ApiEndpoints.University.MasterUniversity.GetById(id)
        );
    }

    addMasterUniversity(model: MasterUniversityRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.University.MasterUniversity.Create,
            model
        );
    }

    updateMasterUniversity(model: MasterUniversityRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.University.MasterUniversity.Update(model.registrationId!),
            model
        );
    }

    deleteMasterUniversity(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.University.MasterUniversity.Delete(id)
        );
    }
}