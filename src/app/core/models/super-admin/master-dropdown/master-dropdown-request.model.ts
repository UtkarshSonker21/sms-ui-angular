export class MasterDropDownRequest {

  uniqueId?: number;

  displayText: string = '';

  parentId?: number;

  displaySequence?: number;

  noSeats?: number;

  isActive: boolean = true;

  isEditable: boolean = false;

  isShow: boolean = true;

  createdBy?: string;

  createdDate?: Date | string;

  moduleId?: number;

  // Response Only
  moduleName?: string;

}