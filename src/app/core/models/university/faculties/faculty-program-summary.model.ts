import { FacultyProgramItem } from './faculty-program-item.model';

export class FacultyProgramsSummary {
  facultyId = 0;

  facultyName = '';

  facultyCode?: string;

  totalPrograms = 0;

  averageSemesters = 0;

  programs: FacultyProgramItem[] = [];
}