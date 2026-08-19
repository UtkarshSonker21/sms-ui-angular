import { BaseFilter } from "../../common/filter/base-filter.model";

export class MasterUniversityFilter extends BaseFilter {

  universityId?: number;

  countryId?: number;

  universityTypeId?: number;

  studentsGenderTypeId?: number;

  accreditationStatus?: number;


  isActive?: boolean;
}