import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { ApiService } from '../common/api.service';
import { ProgramAccreditationModel } from '../../models/ngo/accreditation/program-accreditation.model';
import { UniversityAccreditationModel } from '../../models/ngo/accreditation/university-accreditation.model';
import { SchoolAccreditationModel } from '../../models/ngo/accreditation/school-accreditation.model';


@Injectable({
    providedIn: 'root'
})
export class AccreditationService {

    private readonly api = inject(ApiService);

    accreditProgram(model: ProgramAccreditationModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.Accreditation.AccreditProgram,
            model
        );
    }

    accreditUniversity(model: UniversityAccreditationModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.Accreditation.AccreditUniversity,
            model
        );
    }

    accreditSchool(model: SchoolAccreditationModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.Accreditation.AccreditSchool,
            model
        );
    }

}