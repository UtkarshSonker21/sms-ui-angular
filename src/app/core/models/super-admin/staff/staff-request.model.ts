export class StaffRequestModel {
  staffId?: number;

  // Staff Type
  staffType: number = 0;

  // Organisation Mapping
  universityIds: number[] = [];
  schoolIds: number[] = [];

  // Personal Information
  staffSalutation: string = '';
  staffFirstName: string = '';
  staffLastName: string = '';
  gender: number = 0;

  // Address
  permCountryId?: number;
  permAddress?: string;
  permCity?: string;
  permZipCode?: string;
  permState?: string;

  // Contact Information
  officialEmail: string = '';
  personalEmail?: string;
  mobileNumber?: string;

  // Other
  photo?: string;
  remarks?: string;

  isActive: boolean = true;

  // Response Convenience
  staffTypeName?: string;
  permCountryName?: string;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;

  // Login
  loginName?: string;
  
}