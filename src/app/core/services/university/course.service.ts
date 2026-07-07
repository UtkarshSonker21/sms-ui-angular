import { Injectable, inject } from '@angular/core';


import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { ApiResponse } from '../../models/common/response/api-response.model';

import { CourseFilter } from '../../models/university/courses/course-filter.model';
import { CourseRequest } from '../../models/university/courses/course-request.model';


@Injectable({
    providedIn: 'root'
})
export class CourseService {

    private readonly api = inject(ApiService);

    getCourses(filter: CourseFilter) {
        return this.api.post<ApiResponse<PagedResult<CourseRequest>>>(
            ApiEndpoints.University.Courses.Search,
            filter
        );
    }

    getCourseById(id: number) {
        return this.api.get<ApiResponse<CourseRequest>>(
            ApiEndpoints.University.Courses.GetById(id)
        );
    }

    addCourse(model: CourseRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.University.Courses.Create,
            model
        );
    }

    updateCourse(model: CourseRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.University.Courses.Update(model.courseId!),
            model
        );
    }

    deleteCourse(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.University.Courses.Delete(id)
        );
    }

}