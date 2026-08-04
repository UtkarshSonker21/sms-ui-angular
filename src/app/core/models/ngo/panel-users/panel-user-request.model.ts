export class PanelUserRequestModel {

  // Staff (null/0 = Create, >0 = Update)
  staffId?: number;

  // Login
  loginId?: number;

  staffType: number = 0;

  // Personal Information
  staffSalutation: string = '';
  staffFirstName: string = '';
  staffLastName: string = '';

  // Response Only
  fullName?: string;

  gender: number | null = null;

  // Contact Information
  officialEmail: string = '';
  personalEmail?: string;
  mobileNumber?: string;
  remarks?: string;

  recoveryEmail: string = '';

  // Role
  roleId: number = 0;

  // Response Only
  roleName?: string;

  loginName?: string;

  // Status
  isActive: boolean = true;

  // Audit Information (Response Only)
  createdDate?: Date;
  createdBy?: number;

  updatedDate?: Date;
  updatedBy?: number;

}