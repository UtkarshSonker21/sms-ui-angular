import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { MarketingAdministrativeFeeHistory } from '../../models/common/marketing-administrative-fee/marketing-administrative-fee-history.model';
import { MarketingAdministrativeFeeRequest } from '../../models/common/marketing-administrative-fee/marketing-administrative-fee-request.model';
import { MarketingAdministrativeFeeResponse } from '../../models/common/marketing-administrative-fee/marketing-administrative-fee-response.model';
import { ApiResponse } from '../../models/common/response/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MarketingAdministrativeFeeService {

  private readonly api = inject(ApiService);

 getCurrent() {
    return this.api.get<ApiResponse<MarketingAdministrativeFeeResponse>>(
      ApiEndpoints.Common.MarketingAdministrativeFee.GetCurrent
    );
  }

  update(request: MarketingAdministrativeFeeRequest) {
    return this.api.put<ApiResponse<boolean>>(
      ApiEndpoints.Common.MarketingAdministrativeFee.Update,
      request
    );
  }

  getHistory() {
    return this.api.get<ApiResponse<MarketingAdministrativeFeeHistory[]>>(
      ApiEndpoints.Common.MarketingAdministrativeFee.GetHistory
    );
  }

}