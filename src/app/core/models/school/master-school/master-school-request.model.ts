export class MasterSchoolRequest {

  schoolId?: number;

  // Identity
  schoolName: string = '';
  shortName: string = '';
  schoolType: number = 1;
  owningInstitution?: string;
  schoolYearOfEstablish?: number;

  // Location
  countryId: number = 0;
  countryName?: string;
  area?: string;
  centerName?: string;
  schoolNumber?: string;

  // Academic
  academicYearStartDate?: string;
  academicYearEndDate?: string;
  schoolTeachingLanguage?: string;
  schoolAccreditations?: string;
  isIslamicCurriculum?: boolean;
  religionSubjectCurriculum?: string;

  // Capacity & Performance
  totalStudentsHighSchool?: number;
  averageStudentsPerClass?: number;
  schoolLocalRank?: number;
  isThreeYearStudentSuccessRateAbove80?: boolean;
  isUniversityEligibilityRateAbove80?: boolean;
  isGraduateEnglishProficiencyAbove80?: boolean;

  // Contact
  schoolWebsite?: string;
  schoolPhoneNo?: string;
  emailId?: string;

  // Principal
  principalName?: string;
  principalMobile?: string;
  principalEmail?: string;

  // Coordinator
  schoolCoordinatorName?: string;
  schoolCoordinatorMobile?: string;
  schoolCoordinatorEmail?: string;

  // System Settings
  defaultCurrencyId?: number;
  defaultCurrencyName?: string;
  schoolStatus: number = 1;

  studentCodeFormatPrefix?: string;
  studentCodeFormatSuffix?: string;
  studentSequenceNumber: number = 1;

  // Accreditation
  accreditationStatus?: number;
  accreditationBy?: number;
  accreditationByName?: string;
  accreditationDate?: string;
  committeeComment?: string;

  // Audit
  isDraft: boolean = true;
  isActive: boolean = true;
  createdDate?: string;
  updatedDate?: string;

  // Response Only
  totalStudents: number = 0;
  schoolTypeName?: string;
  schoolStatusName?: string;

  // future
  gradeRange?: string;
  kafaatSponsoredStudents?: number;
  graduatesCount?: number;


}