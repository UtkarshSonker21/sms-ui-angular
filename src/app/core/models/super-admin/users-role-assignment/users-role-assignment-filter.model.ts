import { BaseFilter } from "../../common/filter/base-filter.model";

export class UsersRoleAssignmentFilterModel extends BaseFilter{
  roleId: number | null = null;
  loginId: number | null = null;
  isDefault: boolean | null = null;
}