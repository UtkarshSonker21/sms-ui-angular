import { Injectable, inject } from '@angular/core';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { ApiResponse } from '../../models/common/response/api-response.model';
import {
  AssignDonorSponsorshipRequest,
  CreateSponsorshipAssignmentRequest,
  SponsorshipAssignment,
  SponsorshipAssignmentOption
} from '../../models/ngo/sponsorshipMatrix/sponsorship-assignment.model';
import { ApiService } from '../common/api.service';

@Injectable({ providedIn: 'root' })
export class SponsorshipAssignmentService {
  private readonly api = inject(ApiService);

  getByApplication(applicationId: number) {
    return this.api.get<ApiResponse<SponsorshipAssignment[]>>(
      ApiEndpoints.Ngo.SponsorshipAssignments.GetByApplication(applicationId)
    );
  }

  getOptionsByCategory(studentCategoryId: number) {
    return this.api.get<ApiResponse<SponsorshipAssignmentOption[]>>(
      ApiEndpoints.Ngo.SponsorshipAssignments.GetOptionsByCategory(studentCategoryId)
    );
  }

  create(applicationId: number, request: CreateSponsorshipAssignmentRequest) {
    return this.api.post<ApiResponse<SponsorshipAssignment>>(
      ApiEndpoints.Ngo.SponsorshipAssignments.Create(applicationId),
      request
    );
  }

  assignDonor(applicationId: number, request: AssignDonorSponsorshipRequest) {
    return this.api.post<ApiResponse<SponsorshipAssignment>>(
      ApiEndpoints.Ngo.SponsorshipAssignments.AssignDonor(applicationId),
      request
    );
  }

  update(assignmentId: number, request: CreateSponsorshipAssignmentRequest) {
    return this.api.put<ApiResponse<SponsorshipAssignment>>(
      ApiEndpoints.Ngo.SponsorshipAssignments.Update(assignmentId),
      request
    );
  }

  deactivate(assignmentId: number) {
    return this.api.put<ApiResponse<SponsorshipAssignment>>(
      ApiEndpoints.Ngo.SponsorshipAssignments.Deactivate(assignmentId),
      {}
    );
  }
}
