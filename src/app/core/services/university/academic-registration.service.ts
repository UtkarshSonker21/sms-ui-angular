import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { AcademicRegistrationFilterModel } from '../../models/university/academic-registration/academic-registration-filter.model';
import { AcademicRegistrationModel } from '../../models/university/academic-registration/academic-registration.model';
import { RegisterStudentRequestModel } from '../../models/university/academic-registration/register-student-request.model';


@Injectable({
    providedIn: 'root'
})
export class AcademicRegistrationService {

    private readonly api = inject(ApiService);

    searchAcademicRegistrations(filter: AcademicRegistrationFilterModel) {
        return this.api.post<ApiResponse<PagedResult<AcademicRegistrationModel>>>(
            ApiEndpoints.University.AcademicRegistration.AcademicRegistrationSearch,
            filter
        );
    }

    registerStudent(model: RegisterStudentRequestModel) {
        return this.api.post<ApiResponse<boolean>>(
            ApiEndpoints.University.AcademicRegistration.AcademicRegistrationRegister,
            model
        );
    }

}