export class SponsorshipAssignmentOption {
  mappingId: number = 0;
  sponsorshipTypeId: number = 0;
  sponsorshipName: string = '';
  frequencyType: number = 0;
  displayOrder?: number | null;
  studentCategoryId: number = 0;
  categoryName: string = '';
}

export class SponsorshipAssignment {
  assignmentId: number = 0;
  applicationId: number = 0;
  sponsorshipCategoryMappingId: number = 0;
  sponsorshipTypeId: number = 0;
  sponsorshipName: string = '';
  studentCategoryId: number = 0;
  categoryName: string = '';
  isActive: boolean = true;
  assignedBy: number = 0;
  assignedDate: string | Date = '';
  updatedBy?: number | null;
  updatedDate?: string | Date | null;
  donorName?: string | null;
  donorCode?: string | null;
  remarks?: string | null;
  permittedSponsorshipTypes: SponsorshipAssignmentOption[] = [];
}

export class CreateSponsorshipAssignmentRequest {
  studentCategoryId: number = 0;
  remarks?: string | null = null;
}

export class AssignDonorSponsorshipRequest {
  applicationId: number = 0;
  sponsorshipCategoryId: number = 0;
  donorName: string = '';
  donorCode: string = '';
  remarks?: string | null = null;
}
