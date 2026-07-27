import { BaseFilter } from "../../common/filter/base-filter.model";

export class MasterCountryFilter extends BaseFilter {
  countryName?: string;
  countryIsdCode?: number;
  countryAlphaCode3?: string;
}