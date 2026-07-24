export class ApplyRequest {
  programId: number = 0;
  remarks?: string;
}

export class StudentProgramApplication {
  applicationId: number = 0;
  studentId: number = 0;

  programId: number = 0;
  programName: string = '';
  programCode: string = '';

  applicationStatus: number = 0;
  applicationStatusName: string = '';

  appliedDate!: Date;
  submittedDate?: Date | null;

  remarks?: string;

  createdBy: number = 0;
  createdDate!: Date;

  isAllRequiredDocumentsUploaded: boolean = false;

  requiredDocuments: RequiredDocument[] = [];
  documents: StudentProgramDocument[] = [];

  universityName: string = '';
  facultyName: string = '';
}

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
  
  description?: string;

  uploadedBy: number = 0;
  uploadedDate!: Date;

  isRequired: boolean = false;
  isUploaded?: boolean;
}

export class StudentHistory {
  studentHistoryId: number = 0;
  studentId: number = 0;
  applicationId?: number | null;

  title: string = '';
  description?: string;

  historyType: number = 0;

  createdBy: number = 0;
  createdDate!: Date;
}

export class CandidateProgram {
  programId: number = 0;
  programName: string = '';
  programCode: string = '';

  universityName: string = '';
  facultyName: string = '';

  duration?: string;
  minimumPercentage?: number;
  
  applicationId?: number;
  applicationStatus?: number;
  applicationStatusName?: string;

  requiredDocuments: RequiredDocument[] = [];
  documents?: StudentProgramDocument[];
}

export class RequiredDocument {
  programDocumentId: number = 0;
  documentTypeId: number = 0;
  documentTypeName: string = '';

  isRequired: boolean = false;
  description?: string;
  isUploaded?: boolean;
}

export class UploadDocumentRequest {
  programDocumentId: number = 0;
  documentTypeId: number = 0;
  file: File | null = null;
}