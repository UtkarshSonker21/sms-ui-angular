import { BaseFilter } from "../../common/filter/base-filter.model";

export class ProgramFilter extends BaseFilter {
  programId?: number;

  countryId?: number;

  universityId?: number;

  facultyId?: number;

  isActive?: boolean;

  isDraft?: boolean;

  accreditationStatus?: number;
}