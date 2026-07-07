import { inject, Injectable } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';

import { MasterCountryFilter } from '../../models/super-admin/master-country/master-country-filter.model';
import { MasterCountryRequest } from '../../models/super-admin/master-country/master-country-request.model';


@Injectable({
    providedIn: 'root'
})
export class MasterCountryService {

    private readonly api = inject(ApiService);

    getMasterCountries(filter: MasterCountryFilter) {
        return this.api.post<ApiResponse<PagedResult<MasterCountryRequest>>>(
            ApiEndpoints.SuperAdmin.MasterCountry.Search,
            filter
        );
    }

    getMasterCountryById(id: number) {
        return this.api.get<ApiResponse<MasterCountryRequest>>(
            ApiEndpoints.SuperAdmin.MasterCountry.GetById(id)
        );
    }

    addMasterCountry(model: MasterCountryRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.MasterCountry.Create,
            model
        );
    }

    updateMasterCountry(model: MasterCountryRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.MasterCountry.Update(model.countryId!),
            model
        );
    }

    deleteMasterCountry(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.MasterCountry.Delete(id)
        );
    }

    // getCountryWiseSchoolCount(filter: MasterCountryFilter) {
    //     return this.api.post<ApiResponse<PagedResult<CountrySchoolCount>>>(
    //         ApiEndpoints.SuperAdmin.MasterCountry.CountrySchoolCount,
    //         filter
    //     );
    // }

}