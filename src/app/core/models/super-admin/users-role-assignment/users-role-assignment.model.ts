export class UsersRoleAssignmentModel {
  roleId: number = 0;
  loginId: number = 0;

  userLoginRoleId: number | null = null;

  isMapped: boolean = false;
  isDefault: boolean = false;

  loginName: string | null = null;
  roleName: string | null = null;
  module: string | null = null;
}