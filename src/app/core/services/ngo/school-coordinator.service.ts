import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { SchoolCoordinatorRequestModel } from '../../models/ngo/school-coordinators/school-coordinator-request.model';
import { SchoolCoordinatorFilterModel } from '../../models/ngo/school-coordinators/school-coordinator-filter.model';

@Injectable({
    providedIn: 'root'
})
export class SchoolCoordinatorService {

    private readonly api = inject(ApiService);

    getSchoolCoordinators(filter: SchoolCoordinatorFilterModel) {
        return this.api.post<ApiResponse<PagedResult<SchoolCoordinatorRequestModel>>>(
            ApiEndpoints.Ngo.SchoolCoordinator.Search,
            filter
        );
    }

    getSchoolCoordinatorById(staffId: number) {
        return this.api.get<ApiResponse<SchoolCoordinatorRequestModel>>(
            ApiEndpoints.Ngo.SchoolCoordinator.GetById(staffId)
        );
    }

    addSchoolCoordinator(model: SchoolCoordinatorRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.SchoolCoordinator.Create,
            model
        );
    }

    updateSchoolCoordinator(model: SchoolCoordinatorRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.Ngo.SchoolCoordinator.Update(model.staffId!),
            model
        );
    }

    deleteSchoolCoordinator(staffId: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.Ngo.SchoolCoordinator.Delete(staffId)
        );
    }

}