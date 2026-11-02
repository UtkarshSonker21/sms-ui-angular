import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { AcademicRegistrationFilterModel } from '../../models/university/academic-registration/academic-registration-filter.model';
import { AcademicRegistrationModel } from '../../models/university/academic-registration/academic-registration.model';
import { RegisterStudentRequestModel } from '../../models/university/academic-registration/register-student-request.model';
import {
    AcademicRegistrationResultsModel,
    AcademicResultsImportPreviewModel,
    AcademicProgressionResponseModel,
    AcademicResultsSaveSummaryModel,
    FinalizeAcademicResultsRequestModel,
    ProgressAcademicRegistrationRequestModel,
    SaveAcademicResultsRequestModel
} from '../../models/university/academic-registration/academic-results.model';
import { AcademicHistoryModel } from '../../models/university/academic-registration/academic-history.model';


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

    getResultsByApplication(applicationId: number) {
        return this.api.get<ApiResponse<AcademicRegistrationResultsModel>>(
            ApiEndpoints.University.AcademicRegistration.GetResultsByApplication(applicationId)
        );
    }

    getHistoryByApplication(applicationId: number) {
        return this.api.get<ApiResponse<AcademicHistoryModel>>(
            ApiEndpoints.University.AcademicRegistration.GetHistoryByApplication(applicationId)
        );
    }

    getResults(academicRegistrationId: number) {
        return this.api.get<ApiResponse<AcademicRegistrationResultsModel>>(
            ApiEndpoints.University.AcademicRegistration.GetResults(academicRegistrationId)
        );
    }

    saveResults(academicRegistrationId: number, model: SaveAcademicResultsRequestModel) {
        return this.api.post<ApiResponse<AcademicResultsSaveSummaryModel>>(
            ApiEndpoints.University.AcademicRegistration.SaveResults(academicRegistrationId),
            model
        );
    }

    finalizeResults(academicRegistrationId: number, model: FinalizeAcademicResultsRequestModel) {
        return this.api.post<ApiResponse<AcademicRegistrationResultsModel>>(
            ApiEndpoints.University.AcademicRegistration.FinalizeResults(academicRegistrationId),
            model
        );
    }

    progressToNextSemester(academicRegistrationId: number, model: ProgressAcademicRegistrationRequestModel) {
        return this.api.post<ApiResponse<AcademicProgressionResponseModel>>(
            ApiEndpoints.University.AcademicRegistration.ProgressToNextSemester(academicRegistrationId),
            model
        );
    }

    downloadResultsImportTemplate() {
        return this.api.getBlob(ApiEndpoints.University.AcademicRegistration.ResultsImportTemplate);
    }

    previewResultsImport(file: File) {
        const form = new FormData();
        form.append('file', file, file.name);
        return this.api.postForm<ApiResponse<AcademicResultsImportPreviewModel>>(
            ApiEndpoints.University.AcademicRegistration.PreviewResultsImport,
            form
        );
    }

    importResults(file: File, previewToken: string | null, expectedUpdatedOn: string | null) {
        const form = new FormData();
        form.append('file', file, file.name);
        if (previewToken) form.append('previewToken', previewToken);
        if (expectedUpdatedOn) form.append('expectedUpdatedOn', expectedUpdatedOn);
        return this.api.postForm<ApiResponse<AcademicResultsSaveSummaryModel>>(
            ApiEndpoints.University.AcademicRegistration.ImportResults,
            form
        );
    }

}
