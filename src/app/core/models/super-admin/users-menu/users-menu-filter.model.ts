import { BaseFilter } from "../../common/filter/base-filter.model";

export class UsersMenuFilterModel extends BaseFilter {
  moduleId?: number;
  parentId?: number;
  isView?: boolean;
  isActive?: boolean;
}