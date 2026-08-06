import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';

import { MasterSchoolFilter } from '../../models/school/master-school/master-school-filter.model';
import { MasterSchoolRequest } from '../../models/school/master-school/master-school-request.model';
import { SchoolByCountryRequest } from '../../models/school/master-school/school-by-country-request.model';
import { SchoolLookup } from '../../models/school/master-school/school-lookup.model';



@Injectable({
    providedIn: 'root'
})
export class MasterSchoolService {

    private readonly api = inject(ApiService);


    getMasterSchools(filter: MasterSchoolFilter) {
        return this.api.post<ApiResponse<PagedResult<MasterSchoolRequest>>>(
            ApiEndpoints.School.MasterSchool.Search,
            filter
        );
    }

    getMasterSchoolById(id: number) {
        return this.api.get<ApiResponse<MasterSchoolRequest>>(
            ApiEndpoints.School.MasterSchool.GetById(id)
        );
    }

    addMasterSchool(model: MasterSchoolRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.School.MasterSchool.Create,
            model
        );
    }

    updateMasterSchool(model: MasterSchoolRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.School.MasterSchool.Update(model.schoolId!),
            model
        );
    }

    deleteMasterSchool(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.School.MasterSchool.Delete(id)
        );
    }



    getSchoolsByCountryIds(request: SchoolByCountryRequest) {
        return this.api.post<ApiResponse<SchoolLookup[]>>(
            ApiEndpoints.School.MasterSchool.GetSchoolsByCountryIds,
            request
        );
    }


    
}