import { FacultyProgramsSummary } from './faculty-program-summary.model';

export class FacultyProgramsDashboard {
  totalFaculties = 0;

  accreditedPrograms = 0;

  underReviewPrograms = 0;

  faculties: FacultyProgramsSummary[] = [];
}