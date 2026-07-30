export class ProgramRegistrationWindowModel {
    id?: number;

    programId: number = 0;

    semesterNo: number = 1;

    registrationFrom: Date = new Date();

    registrationTo: Date = new Date();

    notes: string = '';

    createdBy: number = 0;

    createdOn: Date = new Date();

    updatedBy?: number;

    updatedOn?: Date;

    // Response Fields
    programName: string = '';

    createdByName: string = '';

    updatedByName: string = '';
}