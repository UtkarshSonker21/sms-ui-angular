import { BaseFilter } from "../../common/filter/base-filter.model";

export class UsersRolePermissionFilterModel extends BaseFilter{

  roleId: number | null = null;
  menuLinkId: number | null = null;

  moduleId: number | null = null;
  isActive: boolean | null = null;
  dashboardMenuLinkId: number | null = null;
}