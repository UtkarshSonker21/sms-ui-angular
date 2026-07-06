import { BaseFilter } from "../../common/filter/base-filter.model";

export class DocumentTypeFilter extends BaseFilter {
  documentTypeId?: number;

  isDefault?: boolean;

  defaultRequired?: boolean;

  isActive?: boolean;
}