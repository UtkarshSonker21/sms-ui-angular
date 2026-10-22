import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { AcademicCalendarRequest } from '../../models/university/academic-calendar/academic-calendar-request.model';
import { AcademicCalendarResponse } from '../../models/university/academic-calendar/academic-calendar-response.model';
import { ApiService } from '../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class AcademicCalendarService {
  private readonly api = inject(ApiService);

  createCalendar(model: AcademicCalendarRequest): Observable<ApiResponse<number>> {
    return this.api.post<ApiResponse<number>>(
      ApiEndpoints.University.AcademicCalendars.Create,
      model
    );
  }

  updateCalendar(academicCalendarId: number, model: AcademicCalendarRequest): Observable<ApiResponse<boolean>> {
    return this.api.put<ApiResponse<boolean>>(
      ApiEndpoints.University.AcademicCalendars.Update(academicCalendarId),
      model
    );
  }

  getCalendarById(academicCalendarId: number): Observable<ApiResponse<AcademicCalendarResponse>> {
    return this.api.get<ApiResponse<AcademicCalendarResponse>>(
      ApiEndpoints.University.AcademicCalendars.GetById(academicCalendarId)
    );
  }

  getCalendarsByUniversity(universityId: number): Observable<ApiResponse<AcademicCalendarResponse[]>> {
    return this.api.get<ApiResponse<AcademicCalendarResponse[]>>(
      ApiEndpoints.University.AcademicCalendars.GetByUniversity(universityId)
    );
  }

  getCalendarByAcademicYear(
    universityId: number,
    academicYearName: string
  ): Observable<ApiResponse<AcademicCalendarResponse>> {
    return this.api.get<ApiResponse<AcademicCalendarResponse>>(
      ApiEndpoints.University.AcademicCalendars.GetByAcademicYear(universityId, academicYearName)
    );
  }
}
