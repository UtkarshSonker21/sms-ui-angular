import { UsersRolePermissionModel } from "./users-role-permission.model";

export class UsersRolePermissionBulkSaveModel {
  roleId: number = 0;
  permissions: UsersRolePermissionModel[] = [];
}