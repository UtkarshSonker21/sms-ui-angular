// core/models/auth/current-user-profile.model.ts

import { StaffType } from "../../../enums/staff-type.enum";

export class CurrentUserProfile {

    loginId!: number;
    loginName!: string;

    currentRoleId!: number;
    currentRoleName!: string;

    moduleId!: number;
    moduleName!: string;

    staffType!: StaffType;

    universityId?: number;
    schoolId?: number;
    ngoId?: number;

    organizationName!: string;

    // ADD THESE (for profile page)
    profilePhoto?: string;

    fullName!: string;
    salutation!: string;
    firstName!: string;
    lastName!: string;

    mobile?: string;
    personalEmail?: string;

    officialEmail!: string;

    status!: boolean;

    address?: string;
    city?: string;
    country?: string;
    zip?: string;

    // default currency info (for school & university) and for rest send base currency info
    defaultCurrencyCode!: string;
    defaultCurrencyName!: string;
    defaultCurrencySymbol!: string;
}