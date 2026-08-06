import { Injectable, inject } from '@angular/core';

import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { ApiResponse } from '../../models/common/response/api-response.model';

import { FacultyRequest } from '../../models/university//faculties/faculty-request.model';
import { FacultyFilter } from '../../models/university/faculties/faculty-filter.model';
import { FacultyProgramsDashboard } from '../../models/university/faculties/faculty-program-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class FacultyService {

  private readonly api = inject(ApiService);

  getFacultyPrograms() {
    return this.api.get<ApiResponse<FacultyProgramsDashboard>>(
      ApiEndpoints.University.Faculties.FacultyPrograms
    );
  }


  getFaculties(filter: FacultyFilter) {
    return this.api.post<ApiResponse<PagedResult<FacultyRequest>>>(
      ApiEndpoints.University.Faculties.Search,
      filter
    );
  }

  getFacultyById(id: number) {
    return this.api.get<ApiResponse<FacultyRequest>>(
      ApiEndpoints.University.Faculties.GetById(id)
    );
  }

  addFaculty(model: FacultyRequest) {
    return this.api.post<ApiResponse<void>>(
      ApiEndpoints.University.Faculties.Create,
      model
    );
  }

  updateFaculty(model: FacultyRequest) {
    return this.api.put<ApiResponse<void>>(
      ApiEndpoints.University.Faculties.Update(model.facultyId!),
      model
    );
  }

  deleteFaculty(id: number) {
    return this.api.delete<ApiResponse<void>>(
      ApiEndpoints.University.Faculties.Delete(id)
    );
  }


}