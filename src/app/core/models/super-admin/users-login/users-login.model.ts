export class UsersLoginRequestModel {
  loginId?: number | null;
  staffId: number = 0;
  loginName: string = '';
  password: string = '';
  recoveryEmail: string = '';
  isActive: boolean = true;
  tempPassword?: string | null;
  tempPassDateTime?: Date | null;

  createdDate?: Date | null;
  createdBy: number = 0;
  createdByName?: string | null;

  updatedDate?: Date | null;
  updatedBy?: number | null;
  updatedByName?: string | null;
}