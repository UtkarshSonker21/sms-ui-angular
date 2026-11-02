export type FailingCoreCaseStatus = 'Pending' | 'Approved' | 'Denied';

export interface FailingCoreCaseCourseModel {
  studentCourseResultId: number;
  programCourseId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  credits: number;
}

export interface FailingCoreCaseModel {
  id: number;
  academicRegistrationId: number;
  applicationId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  universityId: number;
  universityName: string;
  programId: number;
  programName: string;
  semesterNo: number;
  semesterName: string | null;
  termName?: string | null;
  academicYearName?: string | null;
  semesterStartDate?: string | null;
  semesterEndDate?: string | null;
  submittedOn: string;
  status: FailingCoreCaseStatus;
  decisionComment: string | null;
  decisionOn: string | null;
  rowVersion: string;
  failedCoreCourses: FailingCoreCaseCourseModel[];
  semesterGpa?: number | null;
  semesterCourses?: FailingCoreCaseSemesterCourseModel[];
}

export interface FailingCoreCaseSemesterCourseModel {
  courseCode: string;
  courseName: string;
  courseType: string;
  credits: number;
  isPassed: boolean | null;
  isRetake: boolean;
}

export interface FailingCoreCaseDecisionModel {
  status: 'Approved' | 'Denied';
  comment: string;
  expectedRowVersion: string;
}
