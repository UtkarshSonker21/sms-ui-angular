import { BaseFilter } from "../../common/filter/base-filter.model";

export class GeneralSettingFilterModel extends BaseFilter{

  configKey: string | null = null;
  configValue: string | null = null;
}