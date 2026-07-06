export class FacultyRequest {
  facultyId?: number;

  universityId = 0;

  facultyName = '';

  facultyCode = '';

  isActive = true;

  // Response Only
  universityName?: string;

  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}