import { BaseFilter } from "../../common/filter/base-filter.model";

export class MasterCurrencyFilter extends BaseFilter {
  currencyName?: string;
  currencyCode?: string;
  isActive?: boolean;
}