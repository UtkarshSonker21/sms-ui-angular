import { BaseFilter } from "../../common/filter/base-filter.model";

export class SponsorshipTypeFilter extends BaseFilter {
  sponsorshipTypeId?: number;

  frequencyType?: number;

  isActive?: boolean;
}