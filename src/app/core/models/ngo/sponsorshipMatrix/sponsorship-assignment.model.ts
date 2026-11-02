export interface SponsorshipAssignment {
  assignmentId: number;
  applicationId: number;
  sponsorshipCategoryMappingId: number;
  sponsorshipTypeId: number;
  sponsorshipName: string;
  studentCategoryId: number;
  categoryName: string;
  isActive: boolean;
  assignedBy: number;
  assignedDate: string | Date;
  updatedBy?: number | null;
  updatedDate?: string | Date | null;
  remarks?: string | null;
  permittedSponsorshipTypes: SponsorshipAssignmentOption[];
}

export interface CreateSponsorshipAssignmentRequest {
  studentCategoryId: number;
  remarks?: string | null;
}

export interface SponsorshipAssignmentOption {
  mappingId: number;
  sponsorshipTypeId: number;
  sponsorshipName: string;
  frequencyType: number;
  displayOrder?: number | null;
  studentCategoryId: number;
  categoryName: string;
}
