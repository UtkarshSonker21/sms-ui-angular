import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { SponsorshipMatrixToggleRequest } from '../../models/ngo/sponsorshipMatrix/sponsorship-matrix-toggle-request.model';
import { SponsorshipMatrix } from '../../models/ngo/sponsorshipMatrix/sponsorship-matrix.model';
import { ApiService } from '../common/api.service';
@Injectable({
    providedIn: 'root'
})
export class SponsorshipMatrixService {

    private readonly api = inject(ApiService);

    getMatrix() {
        return this.api.get<ApiResponse<SponsorshipMatrix>>(
            ApiEndpoints.Ngo.SponsorshipMatrix.GetMatrix
        );
    }

    toggle(model: SponsorshipMatrixToggleRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.SponsorshipMatrix.Toggle,
            model
        );
    }

}