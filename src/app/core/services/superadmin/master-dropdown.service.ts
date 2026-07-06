import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';

import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { MasterDropDownRequest } from '../../models/super-admin/master-dropdown/master-dropdown-request.model';
import { MasterDropDownFilter } from '../../models/super-admin/master-dropdown/master-dropdown-filter.model';



@Injectable({
    providedIn: 'root'
})
export class MasterDropDownService {

    private readonly api = inject(ApiService);

    getMasterDropDowns(filter: MasterDropDownFilter) {
        return this.api.post<ApiResponse<PagedResult<MasterDropDownRequest>>>(
            ApiEndpoints.SuperAdmin.MasterDropDown.Search,
            filter
        );
    }

    getMasterDropDownById(id: number) {
        return this.api.get<ApiResponse<MasterDropDownRequest>>(
            `${ApiEndpoints.SuperAdmin.MasterDropDown.GetById}/${id}`
        );
    }

    addMasterDropDown(model: MasterDropDownRequest) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.MasterDropDown.Create,
            model
        );
    }

    updateMasterDropDown(model: MasterDropDownRequest) {
        return this.api.put<ApiResponse<void>>(
            `${ApiEndpoints.SuperAdmin.MasterDropDown.Update}/${model.uniqueId}`,
            model
        );
    }

    deleteMasterDropDown(id: number) {
        return this.api.delete<ApiResponse<void>>(
            `${ApiEndpoints.SuperAdmin.MasterDropDown.Delete}/${id}`
        );
    }

    // helpwr methods 
    // getByParentId(parentId: number) {
    //     const filter = new MasterDropDownFilter();
    //     filter.pageNumber = 1;
    //     filter.pageSize = 0;
    //     filter.status = true;
    //     filter.parentId = parentId;
    //     return this.getMasterDropDowns(filter);
    // }


    getByParentId(parentId: number) {
        return this.api.get<ApiResponse<MasterDropDownRequest[]>>(
            `${ApiEndpoints.SuperAdmin.MasterDropDown.GetByParentId}/${parentId}`
        );
    }



}