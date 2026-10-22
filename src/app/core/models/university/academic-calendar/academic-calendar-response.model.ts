import { AcademicTermResponse } from './academic-term-response.model';

export class AcademicCalendarResponse {
  academicCalendarId = 0;
  universityId = 0;
  academicYearName = '';
  periodStartDate = '';
  periodEndDate = '';
  academicYearStartMonth = 1;
  academicYearEndMonth = 1;
  termsPerYear: 2 | 3 | 4 = 2;
  namingStyle = '';
  reusePreviousCalendar = true;
  reusedFromCalendarId?: number | null;
  createdOn = '';
  updatedOn?: string | null;
  terms: AcademicTermResponse[] = [];
}
