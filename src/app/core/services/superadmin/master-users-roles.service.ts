import { inject, Injectable } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { UsersRoleByModulesRequestModel } from '../../models/super-admin/users-role/users-role-by-modules-request.model';
import { UsersRoleFilterModel } from '../../models/super-admin/users-role/users-role-filter.model';
import { UsersRoleLookupModel } from '../../models/super-admin/users-role/users-role-lookup.model';
import { UsersRoleRequestModel } from '../../models/super-admin/users-role/users-role-request.model';


@Injectable({
    providedIn: 'root'
})
export class MasterUsersRoleService {

    private readonly api = inject(ApiService);

    getUsersRoles(filter: UsersRoleFilterModel) {
        return this.api.post<ApiResponse<PagedResult<UsersRoleRequestModel>>>(
            ApiEndpoints.SuperAdmin.UsersRole.Search,
            filter
        );
    }

    getUsersRoleById(id: number) {
        return this.api.get<ApiResponse<UsersRoleRequestModel>>(
            ApiEndpoints.SuperAdmin.UsersRole.GetById(id)
        );
    }

    addUsersRole(model: UsersRoleRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersRole.Create,
            model
        );
    }

    updateUsersRole(model: UsersRoleRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersRole.Update(model.roleId!),
            model
        );
    }

    deleteUsersRole(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersRole.Delete(id)
        );
    }

    getUsersRolesByModules(model: UsersRoleByModulesRequestModel) {
        return this.api.post<ApiResponse<UsersRoleLookupModel[]>>(
            ApiEndpoints.SuperAdmin.UsersRole.GetByModules,
            model
        );
    }

}