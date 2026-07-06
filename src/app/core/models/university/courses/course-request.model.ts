import { CourseFaculty } from './course-faculty.model';

export class CourseRequest {
  courseId?: number;

  universityId = 0;
  courseCode = '';
  courseNameEn = '';
  courseNameAr?: string;
  isActive = true;

  faculties: CourseFaculty[] = [];
  facultyIds: number[] = [];

  universityName?: string;

  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}