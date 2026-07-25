import { RequiredDocument } from './required-document.model';
import { StudentProgramDocument } from './student-program-document.model';

export class StudentProgramApplicationResponse {

  applicationId: number = 0;

  studentId: number = 0;

  programId: number = 0;
  programName: string = '';
  programCode: string = '';

  applicationStatus: number = 0;
  applicationStatusName: string = '';

  appliedDate!: Date;
  submittedDate?: Date;

  remarks?: string;

  createdBy: number = 0;
  createdDate!: Date;

  isAllRequiredDocumentsUploaded: boolean = false;

  requiredDocuments: RequiredDocument[] = [];

  documents: StudentProgramDocument[] = [];

  universityName: string = '';

  facultyName: string = '';

}