export class MasterUniversityRequest {

  universityId?: number;

  // University Information
  universityName: string = '';
  universityType: string = '';
  charterAccreditation?: string;
  establishedYear?: number;
  countryId: number = 0;
  city: string = '';
  address?: string;
  website?: string;

  // Vice Chancellor
  vcName?: string;
  vcEmail?: string;
  vcMobile?: string;

  // Coordinator
  coordName: string = '';
  coordPosition?: string;
  coordEmail: string = '';
  coordPhone: string = '';

  // Institution Scale
  facultiesCount?: number;
  facultyFulltimeCount?: number;
  adminStaffCount?: number;

  progDegreeCount?: number;
  progDiplomaCount?: number;
  progCertificateCount?: number;
  progPostgradCount?: number;

  studentsTotal?: number;
  studentsEnrolled?: number;
  intlStudentsPct?: number;
  studentsGender?: string;

  studDegreeCount?: number;
  studDiplomaCount?: number;
  studCertificateCount?: number;
  studPostgradCount?: number;

  graduatesTotal?: number;
  alumniCount?: number;

  // Quality & Research
  opSustainabilityPct?: number;
  employabilityPct?: number;
  phdStaffPct?: number;

  fteRatio?: string;
  teachingLoadHours?: number;
  annualPublications?: number;
  onlineProgramsCount?: number;
  intlAccreditedProgramsCount?: number;

  externalGrants?: string;
  notes?: string;

  // Accreditation Workflow
  accreditationStatus: number = 1;
  accreditationBy?: number;
  accreditationDate?: Date | string;
  committeeComment?: string;

  // System
  isDraft: boolean = true;
  isActive: boolean = true;

  createdBy?: number;
  createdDate?: Date | string;

  updatedBy?: number;
  updatedDate?: Date | string;

}





  //  registrationId?: number;

  //   // ─────────────────────────────────────────────────────────────
  //   // Basic Information
  //   // ─────────────────────────────────────────────────────────────

  //   universityName: string = '';

  //   universityTypeId?: number;

  //   charterAccreditation?: string;

  //   establishedYear?: number;

  //   countryId!: number;

  //   city: string = '';

  //   address?: string;

  //   website?: string;

  //   // ─────────────────────────────────────────────────────────────
  //   // Vice Chancellor
  //   // ─────────────────────────────────────────────────────────────

  //   vcName?: string;

  //   vcEmail?: string;

  //   vcMobile?: string;

  //   // ─────────────────────────────────────────────────────────────
  //   // Coordinator
  //   // ─────────────────────────────────────────────────────────────

  //   coordName: string = '';

  //   coordPosition?: string;

  //   coordEmail: string = '';

  //   coordPhone: string = '';

  //   // ─────────────────────────────────────────────────────────────
  //   // Statistics
  //   // ─────────────────────────────────────────────────────────────

  //   facultiesCount?: number;

  //   facultyFulltimeCount?: number;

  //   adminStaffCount?: number;

  //   progDegreeCount?: number;

  //   progDiplomaCount?: number;

  //   progCertificateCount?: number;

  //   progPostgradCount?: number;

  //   studentsTotal?: number;

  //   studentsEnrolled?: number;

  //   intlStudentsPct?: number;

  //   studentsGenderTypeId?: number;

  //   studDegreeCount?: number;

  //   studDiplomaCount?: number;

  //   studCertificateCount?: number;

  //   studPostgradCount?: number;

  //   graduatesTotal?: number;

  //   alumniCount?: number;

  //   // ─────────────────────────────────────────────────────────────
  //   // Performance
  //   // ─────────────────────────────────────────────────────────────

  //   opSustainabilityPct?: number;

  //   employabilityPct?: number;

  //   phdStaffPct?: number;

  //   fteRatio?: string;

  //   teachingLoadHours?: number;

  //   annualPublications?: number;

  //   onlineProgramsCount?: number;

  //   intlAccreditedProgramsCount?: number;

  //   externalGrants?: string;

  //   notes?: string;

  //   // ─────────────────────────────────────────────────────────────
  //   // Accreditation
  //   // ─────────────────────────────────────────────────────────────

  //   accreditationStatus: number = 0;

  //   accreditationBy?: number;

  //   accreditationDate?: Date;

  //   committeeComment?: string;

  //   // ─────────────────────────────────────────────────────────────
  //   // Audit
  //   // ─────────────────────────────────────────────────────────────

  //   isDraft: boolean = false;

  //   isActive: boolean = true;

  //   createdBy?: number;

  //   createdDate?: Date;

  //   updatedBy?: number;

  //   updatedDate?: Date;

  //   // ─────────────────────────────────────────────────────────────
  //   // Response Only
  //   // ─────────────────────────────────────────────────────────────

  //   countryName?: string;

  //   universityTypeName?: string;

  //   studentsGenderTypeName?: string;

  //   accreditationStatusName?: string;

  //   accreditationByName?: string;

  //   createdByName?: string;

  //   updatedByName?: string;

  //   formattedCreatedDate?: string;

  //   formattedUpdatedDate?: string;
