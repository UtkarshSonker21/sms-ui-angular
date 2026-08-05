import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { UniversityCoordinatorRequestModel } from '../../models/ngo/university-coordinators/university-coordinator-request.model';
import { UniversityCoordinatorFilterModel } from '../../models/ngo/university-coordinators/university-coordinator-filter.model';

@Injectable({
    providedIn: 'root'
})
export class UniversityCoordinatorService {

    private readonly api = inject(ApiService);

    getUniversityCoordinators(filter: UniversityCoordinatorFilterModel) {
        return this.api.post<ApiResponse<PagedResult<UniversityCoordinatorRequestModel>>>(
            ApiEndpoints.Ngo.UniversityCoordinator.Search,
            filter
        );
    }

    getUniversityCoordinatorById(staffId: number) {
        return this.api.get<ApiResponse<UniversityCoordinatorRequestModel>>(
            ApiEndpoints.Ngo.UniversityCoordinator.GetById(staffId)
        );
    }

    addUniversityCoordinator(model: UniversityCoordinatorRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.UniversityCoordinator.Create,
            model
        );
    }

    updateUniversityCoordinator(model: UniversityCoordinatorRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.Ngo.UniversityCoordinator.Update(model.staffId!),
            model
        );
    }

    deleteUniversityCoordinator(staffId: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.Ngo.UniversityCoordinator.Delete(staffId)
        );
    }

}