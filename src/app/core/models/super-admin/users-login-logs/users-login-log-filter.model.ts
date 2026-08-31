import { BaseFilter } from "../../common/filter/base-filter.model";

export class UsersLoginLogFilter extends BaseFilter{
    loginId?: number;
    loginFrom?: Date;
    loginTo?: Date;
}