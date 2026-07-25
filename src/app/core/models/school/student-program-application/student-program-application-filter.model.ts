import { BaseFilter } from "../../common/filter/base-filter.model";

export class StudentProgramApplicationFilter extends BaseFilter {

  schoolCoordinatorId?: number;

  universityId?: number;

  facultyId?: number;

  programId?: number;

  applicationStatusId?: number;

}