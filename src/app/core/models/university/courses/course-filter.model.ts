import { BaseFilter } from "../../common/filter/base-filter.model";

export class CourseFilter extends BaseFilter {
  courseId?: number;
  universityId?: number;
  facultyId?: number;
  isActive?: boolean;
}