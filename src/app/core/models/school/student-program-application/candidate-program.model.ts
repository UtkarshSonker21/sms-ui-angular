import { RequiredDocument } from './required-document.model';
import { StudentProgramDocument } from './student-program-document.model';

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
