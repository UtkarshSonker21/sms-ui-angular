import { UsersRoleAssignmentModel } from "./users-role-assignment.model";

export class UsersRoleAssignmentSaveModel {
  loginId: number = 0;
  roles: UsersRoleAssignmentModel[] = [];
}