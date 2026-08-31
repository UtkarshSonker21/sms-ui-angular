import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { UsersLoginLogFilter } from '../../models/super-admin/users-login-logs/users-login-log-filter.model';
import { UsersLoginLogRequest } from '../../models/super-admin/users-login-logs/users-login-log-request.model';


@Injectable({
    providedIn: 'root'
})
export class UsersLoginLogService {

    private readonly api = inject(ApiService);

    getLoginLogs(filter: UsersLoginLogFilter) {
        return this.api.post<ApiResponse<PagedResult<UsersLoginLogRequest>>>(
            ApiEndpoints.SuperAdmin.UsersLoginLog.Search,
            filter
        );
    }

    getLoginLogById(id: number) {
        return this.api.get<ApiResponse<UsersLoginLogRequest>>(
            ApiEndpoints.SuperAdmin.UsersLoginLog.GetById(id)
        );
    }

}