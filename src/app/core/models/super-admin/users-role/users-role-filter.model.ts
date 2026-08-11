import { BaseFilter } from "../../common/filter/base-filter.model";

export class UsersRoleFilterModel extends BaseFilter {
  moduleId?: number;
  dashboardMenuLinkId?: number;
  isActive?: boolean;
}