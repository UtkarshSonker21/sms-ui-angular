import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';

import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';

import { ProgramFilter } from '../../models/university/programs/program-filter.model';
import { ProgramRequest } from '../../models/university/programs/program-request.model';

@Injectable({
    providedIn: 'root'
})
export class ProgramService {

    private readonly api = inject(ApiService);

    getPrograms(filter: ProgramFilter) {
        return this.api.post<ApiResponse<PagedResult<ProgramRequest>>>(
            ApiEndpoints.University.Programs.Search,
            filter
        );
    }

    getProgramById(id: number) {
        return this.api.get<ApiResponse<ProgramRequest>>(
            ApiEndpoints.University.Programs.GetById(id)
        );
    }

    addProgram(model: ProgramRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.University.Programs.Create,
            model
        );
    }

    updateProgram(model: ProgramRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.University.Programs.Update(model.programId!),
            model
        );
    }

    deleteProgram(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.University.Programs.Delete(id)
        );
    }

}