import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { UniversityStudentFilterModel } from '../../models/university/university-students/university-student-filter.model';
import { UniversityStudentRequestModel } from '../../models/university/university-students/university-student-request.model';


@Injectable({
    providedIn: 'root'
})
export class UniversityStudentService {

    private readonly api = inject(ApiService);

    getStudents(filter: UniversityStudentFilterModel) {
        return this.api.post<ApiResponse<PagedResult<UniversityStudentRequestModel>>>(
            ApiEndpoints.University.Students.Search,
            filter
        );
    }

    getStudentById(id: number) {
        return this.api.get<ApiResponse<UniversityStudentRequestModel>>(
            ApiEndpoints.University.Students.GetById(id)
        );
    }

}