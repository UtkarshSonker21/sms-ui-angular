import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';

import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { SponsorshipTypeFilter } from '../../models/ngo/sponsorship-type/sponsorship-type-filter.model';
import { SponsorshipTypeRequest } from '../../models/ngo/sponsorship-type/sponsorship-type-request.model';

@Injectable({
    providedIn: 'root'
})
export class SponsorshipTypeService {

    private readonly api = inject(ApiService);

    getSponsorshipTypes(filter: SponsorshipTypeFilter) {
        return this.api.post<ApiResponse<PagedResult<SponsorshipTypeRequest>>>(
            ApiEndpoints.Ngo.SponsorshipTypes.Search,
            filter
        );
    }

    getSponsorshipTypeById(id: number) {
        return this.api.get<ApiResponse<SponsorshipTypeRequest>>(
            `${ApiEndpoints.Ngo.SponsorshipTypes.GetById}/${id}`
        );
    }

    addSponsorshipType(model: SponsorshipTypeRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.SponsorshipTypes.Create,
            model
        );
    }

    updateSponsorshipType(model: SponsorshipTypeRequest) {
        return this.api.put<ApiResponse<void>>(
            `${ApiEndpoints.Ngo.SponsorshipTypes.Update}/${model.sponsorshipTypeId}`,
            model
        );
    }

    deleteSponsorshipType(id: number) {
        return this.api.delete<ApiResponse<void>>(
            `${ApiEndpoints.Ngo.SponsorshipTypes.Delete}/${id}`
        );
    }

}