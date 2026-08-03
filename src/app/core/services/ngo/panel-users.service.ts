import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { PanelUserRequestModel } from '../../models/ngo/panel-users/panel-user-request.model';
import { PanelUserFilterModel } from '../../models/ngo/panel-users/panel-user-filter.dto';


@Injectable({
    providedIn: 'root'
})
export class PanelUserService {

    private readonly api = inject(ApiService);

    getPanelUsers(filter: PanelUserFilterModel) {
        return this.api.post<ApiResponse<PagedResult<PanelUserRequestModel>>>(
            ApiEndpoints.Ngo.PanelUsers.Search,
            filter
        );
    }

    getPanelUserById(id: number) {
        return this.api.get<ApiResponse<PanelUserRequestModel>>(
            ApiEndpoints.Ngo.PanelUsers.GetById(id)
        );
    }

    addPanelUser(model: PanelUserRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.Ngo.PanelUsers.Create,
            model
        );
    }

    updatePanelUser(model: PanelUserRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.Ngo.PanelUsers.Update(model.staffId!),
            model
        );
    }

    deletePanelUser(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.Ngo.PanelUsers.Delete(id)
        );
    }

}