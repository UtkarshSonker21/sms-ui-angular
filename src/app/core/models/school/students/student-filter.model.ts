import { BaseFilter } from "../../common/filter/base-filter.model";

export class StudntFilter extends BaseFilter {

    studentId?: number;

    schoolId?: number;

    nationalityId?: number;

    residenceCountryId?: number;

    religionId?: number;

    genderId?: number;

    fromDaSchool?: boolean;

    isOrphan?: boolean;

    isDraft?: boolean;

    isActive?: boolean;

    financialNeedStatusId?: number;

    selfRelianceLevelId?: number;

    motivationLevelId?: number;

    futureGoalsLevelId?: number;

    dobFrom?: Date;

    dobTo?: Date;

    studentStatusId?: number;
    hsSpecialization?: number;
}
