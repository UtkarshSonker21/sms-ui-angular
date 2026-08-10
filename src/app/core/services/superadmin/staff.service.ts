import { inject, Injectable } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { ApiService } from '../common/api.service';
import { StaffFilterModel } from '../../models/super-admin/staff/staff-filter.model';
import { StaffRequestModel } from '../../models/super-admin/staff/staff-request.model';


@Injectable({
    providedIn: 'root'
})
export class StaffService {

    private readonly api = inject(ApiService);

    getStaffs(filter: StaffFilterModel) {
        return this.api.post<ApiResponse<PagedResult<StaffRequestModel>>>(
            ApiEndpoints.SuperAdmin.Staff.Search,
            filter
        );
    }

    getStaffById(id: number) {
        return this.api.get<ApiResponse<StaffRequestModel>>(
            ApiEndpoints.SuperAdmin.Staff.GetById(id)
        );
    }

    addStaff(model: StaffRequestModel) {
        return this.api.post<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Staff.Create,
            model
        );
    }

    updateStaff(model: StaffRequestModel) {
        return this.api.put<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Staff.Update(model.staffId!),
            model
        );
    }

    deleteStaff(id: number) {
        return this.api.delete<ApiResponse<void>>(
            ApiEndpoints.SuperAdmin.Staff.Delete(id)
        );
    }

}