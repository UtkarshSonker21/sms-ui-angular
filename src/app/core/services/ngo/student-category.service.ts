import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { StudentCategoryFilter } from '../../models/ngo/student-category/student-category-filter.model';
import { ApiService } from '../common/api.service';
import { StudentCategoryRequest } from '../../models/ngo/student-category/student-category.request.model';

@Injectable({
    providedIn: 'root'
})
export class StudentCategoryService {

    private readonly api = inject(ApiService);

    getStudentCategories(filter: StudentCategoryFilter) {
        return this.api.post<ApiResponse<PagedResult<StudentCategoryRequest>>>(
            ApiEndpoints.Ngo.StudentCategories.Search,
            filter
        );
    }

    getStudentCategoryById(id: number) {
        return this.api.get<ApiResponse<StudentCategoryRequest>>(
            ApiEndpoints.Ngo.StudentCategories.GetById(id)
        );
    }

    addStudentCategory(model: StudentCategoryRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.StudentCategories.Create,
            model
        );
    }

    updateStudentCategory(model: StudentCategoryRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.Ngo.StudentCategories.Update(model.studentCategoryId!),
            model
        );
    }

    deleteStudentCategory(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.Ngo.StudentCategories.Delete(id)
        );
    }
}