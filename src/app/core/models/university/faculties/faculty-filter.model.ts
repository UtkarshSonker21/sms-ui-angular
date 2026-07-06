import { BaseFilter } from "../../common/filter/base-filter.model";

export class FacultyFilter extends BaseFilter {
  facultyId?: number;

  universityId?: number;

  isActive?: boolean;
}