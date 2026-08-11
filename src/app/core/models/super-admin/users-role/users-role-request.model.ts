export class UsersRoleRequestModel {
  roleId?: number;

  roleName: string = '';
  description?: string;

  moduleId: number = 0;

  isActive: boolean = true;

  createdDate?: Date;
  createdBy?: number;

  moduleName?: string;
}