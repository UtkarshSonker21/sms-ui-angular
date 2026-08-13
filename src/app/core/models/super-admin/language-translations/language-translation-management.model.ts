import { LanguageTranslationItemModel } from './language-translation-item.model';

export class LanguageTranslationManagementModel {
  labelId: number = 0;

  moduleId?: number | null;
  moduleName?: string | null;

  // Label key / unique identifier
  labelKey: string = '';

  // English / Master Value
  englishMasterValue: string = '';

  translations: LanguageTranslationItemModel[] = [];
}