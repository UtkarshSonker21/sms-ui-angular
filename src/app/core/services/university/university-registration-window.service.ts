import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import {
  CloseUniversityRegistrationWindowRequest,
  OpenUniversityRegistrationWindowRequest,
  UniversityRegistrationWindowsResponse
} from '../../models/university/academic-registration/university-registration-window.model';
import { ApiService } from '../common/api.service';

@Injectable({ providedIn: 'root' })
export class UniversityRegistrationWindowService {
  private readonly api = inject(ApiService);

  getForUser(): Observable<ApiResponse<UniversityRegistrationWindowsResponse>> {
    return this.api.get<ApiResponse<UniversityRegistrationWindowsResponse>>(
      ApiEndpoints.University.UniversityRegistrationWindows.Get
    );
  }

  openOrUpdate(request: OpenUniversityRegistrationWindowRequest): Observable<ApiResponse<number>> {
    return this.api.put<ApiResponse<number>>(
      ApiEndpoints.University.UniversityRegistrationWindows.OpenOrUpdate,
      request
    );
  }

  close(id: number, request: CloseUniversityRegistrationWindowRequest): Observable<ApiResponse<boolean>> {
    return this.api.put<ApiResponse<boolean>>(
      ApiEndpoints.University.UniversityRegistrationWindows.Close(id),
      request
    );
  }
}
