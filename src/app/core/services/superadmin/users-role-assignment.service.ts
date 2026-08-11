import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { UsersRoleAssignmentFilterModel } from '../../models/super-admin/users-role-assignment/users-role-assignment-filter.model';
import { UsersRoleAssignmentSaveModel } from '../../models/super-admin/users-role-assignment/users-role-assignment-save.model';
import { UsersRoleAssignmentModel } from '../../models/super-admin/users-role-assignment/users-role-assignment.model';

@Injectable({
    providedIn: 'root'
})
export class UsersRoleAssignmentService {

    private readonly api = inject(ApiService);

    // -------- SEARCH / GET ALL --------
    getRoleAssignments(filter: UsersRoleAssignmentFilterModel) {
        return this.api.post<ApiResponse<PagedResult<UsersRoleAssignmentModel>>>(
            ApiEndpoints.SuperAdmin.UsersRoleAssignment.GetRoleAssignments,
            filter
        );
    }

    // -------- BULK SAVE --------
    saveRoleAssignments(model: UsersRoleAssignmentSaveModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.UsersRoleAssignment.BulkSave,
            model
        );
    }

}