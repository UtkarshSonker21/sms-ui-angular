export class DocumentTypeRequest {
  documentTypeId?: number;

  documentName: string = '';

  isDefault: boolean = false;

  defaultRequired: boolean = false;

  displayOrder?: number;

  isActive: boolean = true;

  // Response Only
  createdDate?: Date | string;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date | string;
  updatedBy?: number;
  updatedByName?: string;
}