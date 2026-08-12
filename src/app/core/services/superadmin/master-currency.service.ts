import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';

import { MasterCurrencyFilter } from '../../models/super-admin/master-currency/master-currency-filter.model';
import { MasterCurrencyRequest } from '../../models/super-admin/master-currency/master-currency-request.model';



@Injectable({
    providedIn: 'root'
})
export class MasterCurrencyService {

    private readonly api = inject(ApiService);
    
    getMasterCurrencies(filter: MasterCurrencyFilter) {
        return this.api.post<ApiResponse<PagedResult<MasterCurrencyRequest>>>(
            ApiEndpoints.SuperAdmin.MasterCurrency.Search,
            filter
        );
    }

    getMasterCurrencyById(id: number) {
        return this.api.get<ApiResponse<MasterCurrencyRequest>>(
            ApiEndpoints.SuperAdmin.MasterCurrency.GetById(id)
        );
    }

    addMasterCurrency(model: MasterCurrencyRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.MasterCurrency.Create,
            model
        );
    }

    updateMasterCurrency(model: MasterCurrencyRequest) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.MasterCurrency.Update(model.currencyId!),
            model
        );
    }

    deleteMasterCurrency(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.MasterCurrency.Delete(id)
        );
    }

}