import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { UsersLoginFilterModel } from '../../models/super-admin/users-login/users-login-filter.model';
import { UsersLoginRequestModel } from '../../models/super-admin/users-login/users-login.model';

@Injectable({
    providedIn: 'root'
})
export class UsersLoginService {

    private readonly api = inject(ApiService);

    getUserLogins(filter: UsersLoginFilterModel) {
        return this.api.post<ApiResponse<PagedResult<UsersLoginRequestModel>>>(
            ApiEndpoints.SuperAdmin.UsersLogin.Search,
            filter
        );
    }

    getUsersLoginById(id: number) {
        return this.api.get<ApiResponse<UsersLoginRequestModel>>(
            ApiEndpoints.SuperAdmin.UsersLogin.GetById(id)
        );
    }


}