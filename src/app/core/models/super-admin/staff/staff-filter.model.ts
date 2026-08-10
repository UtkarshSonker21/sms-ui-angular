import { BaseFilter } from "../../common/filter/base-filter.model";

export class StaffFilterModel extends BaseFilter {
  staffType?: number;

  organisationId?: number;

  countryId?: number;

  isActive?: boolean;
}