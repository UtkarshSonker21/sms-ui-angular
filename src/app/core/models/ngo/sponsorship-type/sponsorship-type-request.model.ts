export class SponsorshipTypeRequest {
  sponsorshipTypeId?: number;

  sponsorshipName: string = '';

  frequencyType: number = 0;

  displayOrder?: number;

  isActive: boolean = true;

  // Response Only
  createdDate?: Date | string;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date | string;
  updatedBy?: number;
  updatedByName?: string;
}