import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
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


    async saveFinalizeAndProgress(
        academicRegistrationId: number,
        model: SaveAcademicResultsRequestModel,
        allowProgression: boolean
    ): Promise<{
        saveSummary: AcademicResultsSaveSummaryModel;
        finalized: AcademicRegistrationResultsModel;
        progression?: AcademicProgressionResponseModel;
    }> {
        // If expectedUpdatedOn was not supplied in model (e.g. caller passed null), check if a draft already exists on the server to obtain the current concurrency token
        let effectiveExpectedUpdatedOn = model.expectedUpdatedOn;
        if (effectiveExpectedUpdatedOn === null || effectiveExpectedUpdatedOn === undefined) {
            const currentCheck = await firstValueFrom(this.getResults(academicRegistrationId));
            if (currentCheck.success && currentCheck.result?.expectedUpdatedOn) {
                effectiveExpectedUpdatedOn = currentCheck.result.expectedUpdatedOn;
            }
        }

        const effectiveModel: SaveAcademicResultsRequestModel = {
            ...model,
            expectedUpdatedOn: effectiveExpectedUpdatedOn
        };

        // 1. Save draft results
        const saveRes = await firstValueFrom(this.saveResults(academicRegistrationId, effectiveModel));
        if (!saveRes.success || !saveRes.result) {
            throw new Error(saveRes.message || 'Failed to save draft results.');
        }

        // 2. Fetch latest concurrency token after save
        const resultsRes = await firstValueFrom(this.getResults(academicRegistrationId));
        if (!resultsRes.success || !resultsRes.result) {
            throw new Error(resultsRes.message || 'Failed to fetch updated registration state.');
        }

        const finalizeToken = resultsRes.result.expectedUpdatedOn ?? saveRes.result.expectedUpdatedOn ?? null;

        // 3. Finalize results
        const finalizeRes = await firstValueFrom(this.finalizeResults(academicRegistrationId, {
            expectedUpdatedOn: finalizeToken
        }));
        if (!finalizeRes.success || !finalizeRes.result) {
            throw new Error(finalizeRes.message || 'Failed to finalize semester results.');
        }

        // 4. Progress to next semester if eligible
        if (!allowProgression) {
            return {
                saveSummary: saveRes.result,
                finalized: finalizeRes.result
            };
        }

        let progRes = await firstValueFrom(this.progressToNextSemester(academicRegistrationId, {
            confirmedRegistrationRestrictionCodes: []
        }));

        if (!progRes.success || !progRes.result) {
            throw new Error(progRes.message || 'Failed to progress to the next semester.');
        }

        const resObj: any = progRes.result;
        const isConfirmationRequired = resObj?.confirmationRequired ?? resObj?.ConfirmationRequired ?? false;
        const warnings: any[] = resObj?.warnings ?? resObj?.Warnings ?? [];

        if (isConfirmationRequired && warnings.length > 0) {
            const confirmedCodes = warnings.map((w: any) => w.code || w.Code);
            progRes = await firstValueFrom(this.progressToNextSemester(academicRegistrationId, {
                confirmedRegistrationRestrictionCodes: confirmedCodes
            }));

            if (!progRes.success || !progRes.result) {
                throw new Error(progRes.message || 'Failed to confirm progression restrictions.');
            }
        }

        return {
            saveSummary: saveRes.result,
            finalized: finalizeRes.result,
            progression: progRes.result
        };
    }

}
