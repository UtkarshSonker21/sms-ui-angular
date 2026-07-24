export class UniversityStudentRequestModel {

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

  // Contact Information
  phoneNumber: string = '';
  emailAddress: string = '';
  city: string = '';
  village: string = '';
  block: string = '';
  street: string = '';

  // Academic Information
  totalScore?: number;
  englishScore?: number;
  hsSpecialization: string = '';
  tanzanianStudentCombination: string = '';

  // School
  schoolName: string = '';

  // Application
  applicationId: number = 0;
  applicationStatusId: number = 0;
  applicationStatusName: string = '';
  actionDate?: Date;

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

  // Permissions
  canApprove: boolean = false;
  canReject: boolean = false;
  canRegister: boolean = false;
  canGraduate: boolean = false;
  canEdit: boolean = false;
  canView: boolean = false;
  
}