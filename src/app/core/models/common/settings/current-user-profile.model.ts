// core/models/auth/current-user-profile.model.ts

import { StaffType } from "../../../enums/staff-type.enum";
import { AvailableRole } from "./available-role.model";

export class CurrentUserProfile {

    loginId!: number;
    loginName!: string;
    usernameOrLoginName?: string;

    availableRoles: AvailableRole[] = [];

    currentRoleId!: number;
    currentRoleName!: string;

    moduleId!: number;
    moduleName!: string;

    staffType!: StaffType;

    // universityId?: number;
    // schoolId?: number;

    universityIds: number[] = [];
    schoolIds: number[] = [];

    organizationName!: string;

    // ADD THESE (for profile page)
    profilePhoto?: string;

    fullName!: string;
    salutation!: string;
    firstName!: string;
    lastName!: string;

    mobileNumber?: string;
    personalEmail?: string;

    officialEmail!: string;

    status!: boolean;

    address?: string;
    city?: string;
    country?: string;
    countryId: number = 0;
    zip?: string;

    // default currency info (for school & university) and for rest send base currency info
    defaultCurrencyCode!: string;
    defaultCurrencyName!: string;
    defaultCurrencySymbol!: string;

}