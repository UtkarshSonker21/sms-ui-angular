import { BaseFilter } from "../../common/filter/base-filter.model";

export class StudentCategoryFilter  extends BaseFilter {
  studentCategoryId?: number;
  isActive?: boolean;
}