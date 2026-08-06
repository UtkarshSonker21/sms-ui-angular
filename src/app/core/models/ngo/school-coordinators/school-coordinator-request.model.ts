export class SchoolCoordinatorRequestModel {

    // Staff
    staffId?: number;

    // Login
    loginId?: number;

    staffType: number = 0;

    // Schools Mapping
    schoolIds: number[] = [];

    // Response Only
    schoolNames: string[] = [];

    // Personal Information
    staffSalutation: string = '';
    staffFirstName: string = '';
    staffLastName: string = '';

    // Response Only
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

    // Response Only
    roleName?: string;
    loginName?: string;

    // Status
    isActive: boolean = true;

    // Audit
    createdDate?: Date;
    createdBy?: number;

    updatedDate?: Date;
    updatedBy?: number;

    // Response Only
    isDefaultRole: boolean = false;
}