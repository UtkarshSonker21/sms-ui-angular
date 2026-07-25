export class StudentProgramDocument {
  studentProgramDocumentId: number = 0;
  applicationId: number = 0;
  programDocumentId: number = 0;

  documentTypeId: number = 0;
  documentTypeName: string = '';

  originalFileName: string = '';
  storedFileName: string = '';
  storagePath: string = '';

  contentType: string = '';
  fileSize: number = 0;

  reviewerRemark?: string;
  universityRemark?: string;
  
  uploadedBy: number = 0;
  uploadedDate!: Date;

  isRequired: boolean = false;
  isUploaded?: boolean;

  description?: string;
}
