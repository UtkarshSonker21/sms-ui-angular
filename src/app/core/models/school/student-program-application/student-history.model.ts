export class StudentHistory {
  studentHistoryId: number = 0;
  studentId: number = 0;
  applicationId?: number | null;

  title: string = '';
  description?: string;

  historyType: number = 0;

  createdBy: number = 0;
  createdDate!: Date;
}
