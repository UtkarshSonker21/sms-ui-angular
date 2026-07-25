export class RequiredDocument {
  programDocumentId: number = 0;
  documentTypeId: number = 0;
  documentTypeName: string = '';

  isRequired: boolean = false;
  description?: string;
  isUploaded?: boolean;
}
