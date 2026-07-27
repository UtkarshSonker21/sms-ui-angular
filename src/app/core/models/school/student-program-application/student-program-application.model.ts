import { RequiredDocument } from "./required-document.model";
import { StudentProgramDocument } from "./student-program-document.model";

export class StudentProgramApplication {
  // Student
  studentId: number = 0;
  studentCode: string = '';
  photoPath: string = '';

  firstName: string = '';
  secondName: string = '';
  thirdName: string = '';
  lastName: string = '';
  fullName: string = '';

  // Personal Information
  motherName: string = '';
  dateOfBirth?: Date;

  genderId?: number;
  genderName: string = '';

  religionId?: number;
  religionName: string = '';

  nationality: string = '';
  countryOfResidence: string = '';

  isDirectAidOrphan?: boolean;
  orphanNumber: string = '';

  // Contact
  phoneNumber: string = '';
  emailAddress: string = '';

  city: string = '';
  village: string = '';
  block: string = '';
  street: string = '';

  // Academic Information
  highSchoolTotalScore?: number;
  highSchoolMaxScore?: number;
  highSchoolRelativeGradeOrPercentage?: number;
  englishScore?: number;

  hsSpecialization: string = '';
  tanzanianStudentCombination: string = '';

  // School
  schoolId?: number;
  schoolName: string = '';

  // Application
  applicationId: number = 0;
  applicationStatusId: number = 0;
  applicationStatus: number = 0;
  applicationStatusName: string = '';
  actionDate?: Date;
  appliedDate!: Date;
  submittedDate?: Date | null;
  remarks?: string;

  createdBy: number = 0;
  createdDate!: Date;

  isAllRequiredDocumentsUploaded: boolean = false;

  requiredDocuments: RequiredDocument[] = [];
  documents: StudentProgramDocument[] = [];

  // Program
  programId: number = 0;
  programName: string = '';
  programCode: string = '';

  // Faculty
  facultyId: number = 0;
  facultyName: string = '';

  // University
  universityId: number = 0;
  universityName: string = '';

  // University specific and permission fields
  canApprove: boolean = false;
  canReject: boolean = false;
  canRegister: boolean = false;
  canGraduate: boolean = false;
  canEdit: boolean = false;
  canView: boolean = false;
  
}