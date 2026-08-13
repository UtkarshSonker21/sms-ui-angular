export class LabelRequestModel {
  labelId?: number | null;
  moduleId?: number | null;

  labelKey: string = '';
  labelValue: string = '';

  isActive: boolean = false;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;

  moduleName?: string;
}