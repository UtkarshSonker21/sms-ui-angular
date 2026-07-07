import { BaseFilter } from "../../common/filter/base-filter.model";

export class MasterSchoolFilter extends BaseFilter {

  // Search
  schoolName?: string;
  countryId?: number;
  schoolType?: number;
  schoolStatus?: number;
  accreditationStatus?: number;
  isActive?: boolean;
  isDraft?: boolean;
  area?: string;
  centerName?: string;
  schoolCoordinatorName?: string;
  schoolNumber?: string;

  // Date Filters
  academicYearStartFrom?: string;
  academicYearStartTo?: string;
  academicYearEndFrom?: string;
  academicYearEndTo?: string;

  createdFrom?: string;
  createdTo?: string;

}