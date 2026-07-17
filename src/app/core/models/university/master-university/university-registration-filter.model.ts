import { BaseFilter } from "../../common/filter/base-filter.model";

export class MasterUniversityFilter extends BaseFilter {

  registrationId?: number;

  universityName?: string;

  countryId?: number;

  universityTypeId?: number;

  studentsGenderTypeId?: number;

  accreditationStatus?: number;

  accreditationBy?: number;

  isDraft?: boolean;

  isActive?: boolean;

  createdFrom?: Date;

  createdTo?: Date;

  accreditationFrom?: Date;

  accreditationTo?: Date;

}