export class UsersLoginLogRequest {
    loginLogId?: number;
    loginId: number = 0;
    ipAddress: string = '';
    loginDateTime: Date = new Date();
    logoutDateTime?: Date;
    browserName?: string;
    operatingSystem?: string;
    computerName?: string;
    userName?: string;

    // For display purpose
    loginName?: string;
}