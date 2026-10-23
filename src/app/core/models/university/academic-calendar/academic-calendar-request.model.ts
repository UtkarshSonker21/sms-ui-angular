import { AcademicTermRequest } from './academic-term-request.model';

export type AcademicCalendarNamingStyle = 'Term' | 'Semester' | 'Seasonal' | 'Custom';

export class AcademicCalendarRequest {
  universityId = 0;
  academicYearName = '';
  periodStartDate = '';
  periodEndDate = '';
  academicYearStartMonth = 1;
  academicYearEndMonth = 1;
  termsPerYear: 2 | 3 | 4 = 2;
  namingStyle: AcademicCalendarNamingStyle = 'Term';
  terms: AcademicTermRequest[] = [];
}
