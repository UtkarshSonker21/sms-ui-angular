import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';

import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { DocumentTypeFilter } from '../../models/ngo/document-type/document-type-filter.model';
import { DocumentTypeRequest } from '../../models/ngo/document-type/document-type-request.model';



@Injectable({
    providedIn: 'root'
})
export class DocumentTypeService {

    private readonly api = inject(ApiService);

    getDocumentTypes(filter: DocumentTypeFilter) {
        return this.api.post<ApiResponse<PagedResult<DocumentTypeRequest>>>(
            ApiEndpoints.University.DocumentTypes.Search,
            filter
        );
    }

    getDocumentTypeById(id: number) {
        return this.api.get<ApiResponse<DocumentTypeRequest>>(
            ApiEndpoints.University.DocumentTypes.GetById(id)
        );
    }

    addDocumentType(model: DocumentTypeRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.University.DocumentTypes.Create,
            model
        );
    }

    updateDocumentType(model: DocumentTypeRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.University.DocumentTypes.Update(model.documentTypeId!),
            model
        );
    }

    deleteDocumentType(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.University.DocumentTypes.Delete(id)
        );
    }

}