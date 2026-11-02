export interface CourseResultEntryModel {
  studentCourseEnrollmentId: number;
  programCourseId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  courseType: number;
  credits: number;
  isPassed: boolean | null;
  grade: string | null;
  remarks: string | null;
}

export interface AcademicRegistrationResultsModel {
  academicRegistrationId: number;
  applicationId: number;
  programId: number;
  semesterNo: number;
  programSemesterId: number | null;
  semesterGpa: number | null;
  internalNote: string | null;
  expectedUpdatedOn: string | null;
  submissionStatus: string | null;
  submittedOn: string | null;
  courses: CourseResultEntryModel[];
}

export interface SaveCourseResultRequestModel {
  studentCourseEnrollmentId: number;
  isPassed: boolean;
}

export interface SaveAcademicResultsRequestModel {
  semesterGpa: number | null;
  internalNote: string | null;
  expectedUpdatedOn: string | null;
  courseResults: SaveCourseResultRequestModel[];
}

export interface FinalizeAcademicResultsRequestModel {
  expectedUpdatedOn: string | null;
}

export interface AcademicProgressionWarningModel {
  code: string;
  message: string;
}

export interface ProgressAcademicRegistrationRequestModel {
  confirmedRegistrationRestrictionCodes: string[];
}

export interface AcademicProgressionResponseModel {
  confirmationRequired: boolean;
  warnings: AcademicProgressionWarningModel[];
  academicRegistrationId: number | null;
  applicationId: number;
  programId: number;
  currentSemesterNo: number;
  nextSemesterNo: number;
  nextProgramSemesterId: number;
  nextSemesterName: string | null;
  nextTermName: string | null;
  academicYearName: string | null;
  semesterStartDate: string | null;
  semesterEndDate: string | null;
  enrollmentSummary: {
    newlyCreatedCount: number;
    alreadyExistingCount: number;
  } | null;
}

export interface AcademicResultsSaveSummaryModel {
  academicRegistrationId: number;
  courseResultsCreated: number;
  courseResultsAlreadyPresent: number;
  semesterResultCreated: boolean;
  submissionStatus: string;
}

export interface AcademicResultsImportRowModel {
  rowNumber: number;
  courseCode: string | null;
  result: string | null;
  isValid: boolean;
  errors: string[];
}

export interface AcademicResultsImportPreviewModel {
  academicRegistrationId: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  canSubmit: boolean;
  expectedUpdatedOn: string | null;
  previewToken: string | null;
  message: string | null;
  rows: AcademicResultsImportRowModel[];
}
