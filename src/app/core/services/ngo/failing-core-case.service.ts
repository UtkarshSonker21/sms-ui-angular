import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { FailingCoreCaseDecisionModel, FailingCoreCaseModel } from '../../models/ngo/failing-core-cases/failing-core-case.model';
import { ApiService } from '../common/api.service';

@Injectable({ providedIn: 'root' })
export class FailingCoreCaseService {
  private readonly api = inject(ApiService);

  getAll() {
    return this.api.get<ApiResponse<FailingCoreCaseModel[]>>(ApiEndpoints.Ngo.FailingCoreCases.GetAll);
  }

  getById(id: number) {
    return this.api.get<ApiResponse<FailingCoreCaseModel>>(ApiEndpoints.Ngo.FailingCoreCases.GetById(id));
  }

  recordDecision(id: number, request: FailingCoreCaseDecisionModel) {
    return this.api.post<ApiResponse<FailingCoreCaseModel>>(ApiEndpoints.Ngo.FailingCoreCases.RecordDecision(id), request);
  }
}
