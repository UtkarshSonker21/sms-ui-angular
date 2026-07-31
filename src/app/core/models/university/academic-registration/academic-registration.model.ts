export class AcademicRegistrationModel {
    id: number = 0;

    studentId: number = 0;
    studentCode: string = '';
    studentName: string = '';
    photoPath : string = '';

    applicationId: number = 0;

    programId: number = 0;
    programName: string = '';

    facultyId: number = 0;
    facultyName: string = '';

    universityId: number = 0;
    universityName: string = '';

    semesterNo: number = 1;

    registrationDate: Date = new Date();

    remarks?: string;

    applicationStatusId: number = 0;
    applicationStatusName: string = '';
}