import { BaseFilter } from "../../common/filter/base-filter.model";

export class LanguageTranslationFilterModel extends BaseFilter {

  labelId?: number | null;
  languageId?: number | null;

  // Management filter
  moduleId?: number | null;
}