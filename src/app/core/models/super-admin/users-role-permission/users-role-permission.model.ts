export class UsersRolePermissionModel {
  menuLinkId: number = 0;
  roleId: number = 0;
  moduleId: number = 0;

  roleFormId: number | null = null;

  viewPer: boolean = false;
  insertPer: boolean = false;
  updatePer: boolean = false;
  deletePer: boolean = false;

  roleName: string | null = null;
  module: string | null = null;
  pageHeading: string | null = null;
  pagePath: string | null = null;

  isMapped: boolean = false;

  parentId: number | null = null;
  levelNo: number | null = null;
  sequenceNo: number | null = null;
}