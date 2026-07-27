import { BaseFilter } from "../../common/filter/base-filter.model";

export class StudentProgramApplicationFilter extends BaseFilter {

  schoolCoordinatorId?: number;

  countryId?: number;

  universityId?: number;

  applicationStatusId?: number;

}