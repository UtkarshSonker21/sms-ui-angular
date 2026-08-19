import { BaseFilter } from "../../common/filter/base-filter.model";

export class MasterSchoolFilter extends BaseFilter {

  // Search
  
  countryId?: number;
  schoolType?: number;
  schoolStatus?: number;
  accreditationStatus?: number;

  isActive?: boolean;

  mySchools?:boolean;

}