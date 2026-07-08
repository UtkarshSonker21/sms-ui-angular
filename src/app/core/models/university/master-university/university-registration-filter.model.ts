import { BaseFilter } from "../../common/filter/base-filter.model";

export class MasterUniversityFilter extends BaseFilter {

  countryId?: number;

  isActive?: boolean;

  isApproved?: boolean;

  approvedBy?: number;

  createdFrom?: Date | string;

  createdTo?: Date | string;

}