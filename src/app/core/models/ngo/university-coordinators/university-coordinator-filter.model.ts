import { BaseFilter } from "../../common/filter/base-filter.model";

export class UniversityCoordinatorFilterModel extends BaseFilter {
  universityId?: number;
  roleId?: number;
  isActive?: boolean;
}