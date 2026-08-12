export class MasterDropDownRequest {

  uniqueId?: number;

  displayText: string = '';

  parentId?: number;

  displaySequence?: number;

  isActive: boolean = true;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}