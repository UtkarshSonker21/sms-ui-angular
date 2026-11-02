export interface AcademicHistoryModel {
  anchorApplicationId: number;
  studentId: number;
  registrations: AcademicHistoryRegistrationModel[];
}

export interface AcademicHistoryRegistrationModel {
  academicRegistrationId: number;
  applicationId: number;
  programId: number;
  programCode: string;
  programName: string;
  semesterNo: number;
  registrationDate: string;
  programSemesterId: number | null;
  scheduleLinkStatus: 'Resolved' | 'ResolvedLegacy' | 'Unresolved' | 'Ambiguous' | string;
  semesterName: string | null;
  academicTermId: number | null;
  academicCalendarId: number | null;
  termSequence: number | null;
  termName: string | null;
  academicYearName: string | null;
  startDate: string | null;
  endDate: string | null;
  dataIssues: string[];
  semesterResult: AcademicHistorySemesterResultModel | null;
  courses: AcademicHistoryCourseModel[];
}

export interface AcademicHistorySemesterResultModel {
  semesterGpa: number | null;
  submissionStatus: string;
  createdOn: string | null;
  updatedOn: string | null;
  submittedOn: string | null;
}

export interface AcademicHistoryCourseModel {
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
  resultRecordedOn: string | null;
  resultUpdatedOn: string | null;
  programSemesterLinkStatus: string;
}
