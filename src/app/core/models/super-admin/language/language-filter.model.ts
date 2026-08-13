import { BaseFilter } from "../../common/filter/base-filter.model";

export class LanguageFilterModel extends BaseFilter {
    isDefault?: boolean;
    isRtl?: boolean;
}