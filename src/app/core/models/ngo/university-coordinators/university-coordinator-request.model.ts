export class UniversityCoordinatorRequestModel {
  // Staff
  staffId?: number;
  loginId?: number;

  staffType: number = 0;

  // University Mapping
  universityIds: number[] = [];
  universityNames: string[] = [];

  // Personal Information
  staffSalutation: string = '';
  staffFirstName: string = '';
  staffLastName: string = '';
  fullName?: string;

  gender: number = 0;

  // Contact Information
  officialEmail: string = '';
  personalEmail?: string;
  mobileNumber?: string;
  remarks?: string;

  recoveryEmail: string = '';

  // Role
  roleId: number = 0;
  roleName?: string;

  // Login
  loginName?: string;

  //status
  isActive:boolean = true;

  // Audit
  createdDate?: Date;
  createdBy?: number;

  updatedDate?: Date;
  updatedBy?: number;

  // Response Only
  isDefaultRole: boolean = false;
}