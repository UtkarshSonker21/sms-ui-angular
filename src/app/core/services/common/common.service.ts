// core/services/common/commonApi.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AppRoutes } from '../../constants/app-routes';

import { ApiService } from './api.service';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { LoadMenu } from '../../models/common/menu/load-menu.model';
import { UsersModule } from '../../models/common/settings/users-module.model';
import { GlobalSearchResponse } from '../../models/common/global-search/global-search-response.model';
import { GlobalSearchRequest } from '../../models/common/global-search/global-search-request.model';

@Injectable({
    providedIn: 'root'
})
export class CommonService {

    private apiService = inject(ApiService);

    getAllMenus(): Observable<ApiResponse<LoadMenu[]>> {
        return this.apiService.get<ApiResponse<LoadMenu[]>>(
            ApiEndpoints.Common.LoadMenus
        );
    }


    getAllUsersModule(): Observable<ApiResponse<UsersModule[]>> {
        return this.apiService.get<ApiResponse<UsersModule[]>>(
            ApiEndpoints.Common.UsersModule
        );
    }


    searchGlobal(request: GlobalSearchRequest): Observable<ApiResponse<GlobalSearchResponse>> {
        return this.apiService.post<ApiResponse<GlobalSearchResponse>>(
            ApiEndpoints.Common.GlobalSearch,
            request
        );
    }


}