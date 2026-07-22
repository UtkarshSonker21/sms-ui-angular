import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { StudentRequest } from '../../models/school/students/student-request.model';
import { StudntFilter } from '../../models/school/students/student-filter.model';


@Injectable({
    providedIn: 'root'
})
export class StudentService {

    private readonly api = inject(ApiService);

    getStudents(filter: StudntFilter) {
        return this.api.post<ApiResponse<PagedResult<StudentRequest>>>(
            ApiEndpoints.School.Student.Search,
            filter
        );
    }

    getStudentById(id: number) {
        return this.api.get<ApiResponse<StudentRequest>>(
            ApiEndpoints.School.Student.GetById(id)
        );
    }

    addStudent(model: StudentRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.School.Student.Create,
            model
        );
    }

    updateStudent(model: StudentRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.School.Student.Update(model.studentId!),
            model
        );
    }

    deleteStudent(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.School.Student.Delete(id)
        );
    }


    uploadProfilePhoto(studentId: number, file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return this.api.post<ApiResponse<string>>(
            ApiEndpoints.School.Student.UploadProfilePhoto(studentId),
            formData
        );
    }

    deleteProfilePhoto(studentId: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.School.Student.DeleteProfilePhoto(studentId)
        );
    }

    uploadRecommendationLetter(studentId: number, file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return this.api.post<ApiResponse<string>>(
            ApiEndpoints.School.Student.UploadRecommendationLetter(studentId),
            formData
        );
    }

    deleteRecommendationLetter(studentId: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.School.Student.DeleteRecommendationLetter(studentId)
        );
    }


}