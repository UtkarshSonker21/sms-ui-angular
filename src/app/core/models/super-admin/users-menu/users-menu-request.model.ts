export class UsersMenuRequestModel {
  menuLinkId?: number;

  // Module
  moduleId: number = 0;

  // Menu Information
  pageHeading: string = '';
  parentId?: number;
  pagePath: string = '';
  actualName: string = '';

  // Visibility / Status
  isView: boolean = false;
  isActive: boolean = true;

  // Ordering
  levelNo: number = 0;
  sequenceNo: number = 0;

  // UI
  icon?: string;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;

  // Response Only
  moduleName?: string;
  parentName?: string;
}   