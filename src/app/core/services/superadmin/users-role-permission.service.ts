import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { UsersRolePermissionFilterModel } from '../../models/super-admin/users-role-permission/users-role-permission-filter.model';
import { UsersRolePermissionModel } from '../../models/super-admin/users-role-permission/users-role-permission.model';
import { UsersRolePermissionBulkSaveModel } from '../../models/super-admin/users-role-permission/users-role-permission-bulk-save.model';

@Injectable({
    providedIn: 'root'
})
export class UsersRolePermissionService {

    private readonly api = inject(ApiService);

    // -------- SEARCH / GET ALL --------
    getRolePermissions(filter: UsersRolePermissionFilterModel) {
        return this.api.post<ApiResponse<PagedResult<UsersRolePermissionModel>>>(
            ApiEndpoints.SuperAdmin.UsersRolePermission.GetRolePermissions,
            filter
        );
    }

    // -------- BULK SAVE --------
    bulkSaveRolePermissions(model: UsersRolePermissionBulkSaveModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersRolePermission.BulkSave,
            model
        );
    }

}