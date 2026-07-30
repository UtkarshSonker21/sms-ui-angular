export class ProgramCourse {
  programCourseId?: number;

  courseId: number = 0;

  courseNameEn?: string;

  courseNameAr?: string;

  courseCode?: string;

  // 1 = Core
  // 2 = Elective
  // 3 = Optional
  courseType: number = 0;

  credits: number = 0;

  displayOrder?: number;

  semesterNo: number = 1;
  semesterName: string = "";
}