import { ProgramCost } from "./program-cost.model";
import { ProgramCourse } from "./program-course.model";
import { ProgramDocument } from "./program-document.model";


export class ProgramRequest {
  programId?: number;

  universityId: number = 0;
  facultyId: number = 0;

  programName: string = '';
  programCode: string = '';

  degree: number = 0;

  numberOfSemesters: number = 0;
  creditsRequired: number = 0;
  allowedStudentSeats: number = 0;

  minAcceptanceRate?: number;

  allowedHighSchoolDivisions?: string;
  allowedTanzanianCombinations?: string;

  isDraft: boolean = false;

  accreditationStatus?: number;

  committeeComment?: string;

  submittedDate?: Date | string;

  isActive: boolean = true;

  // Response Only
  universityName?: string;
  facultyName?: string;
  facultyCode?: string;

  createdDate?: Date | string;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date | string;
  updatedBy?: number;
  updatedByName?: string;

  degreeName?: string;

  // Child Collections
  documents: ProgramDocument[] = [];
  costs: ProgramCost[] = [];
  courses: ProgramCourse[] = [];
}