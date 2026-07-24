import { BaseFilter } from "../../common/filter/base-filter.model";

export class UniversityStudentFilterModel extends BaseFilter {
  universityId?: number;
  facultyId?: number;
  programId?: number;
  studentStatusId?: number;
}