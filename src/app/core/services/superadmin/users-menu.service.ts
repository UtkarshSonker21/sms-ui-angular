import { UsersMenuFilterModel } from './../../models/super-admin/users-menu/users-menu-filter.model';
import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { UsersMenuRequestModel } from '../../models/super-admin/users-menu/users-menu-request.model';


@Injectable({
    providedIn: 'root'
})
export class UsersMenuService {

    private readonly api = inject(ApiService);

    getUserMenus(filter: UsersMenuFilterModel) {
        return this.api.post<ApiResponse<PagedResult<UsersMenuRequestModel>>>(
            ApiEndpoints.SuperAdmin.UsersMenu.Search,
            filter
        );
    }

    getUserMenuById(id: number) {
        return this.api.get<ApiResponse<UsersMenuRequestModel>>(
            ApiEndpoints.SuperAdmin.UsersMenu.GetById(id)
        );
    }

    addUserMenu(model: UsersMenuRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersMenu.Create,
            model
        );
    }

    updateUserMenu(model: UsersMenuRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersMenu.Update(model.menuLinkId!),
            model
        );
    }

    deleteUserMenu(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersMenu.Delete(id)
        );
    }

}