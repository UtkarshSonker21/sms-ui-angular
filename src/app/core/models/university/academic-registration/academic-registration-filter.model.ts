import { BaseFilter } from "../../common/filter/base-filter.model";

export class AcademicRegistrationFilterModel extends BaseFilter {
    universityId?: number;

    facultyId?: number;

    programId?: number;

    semesterNo?: number;

    registeredOnly?: boolean;
}