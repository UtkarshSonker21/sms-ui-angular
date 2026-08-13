export class LanguageTranslationRequestModel {
  translationId?: number | null;

  labelId: number = 0;
  languageId: number = 0;

  labelValue: string = '';

  isActive: boolean = false;

  // Display information
  labelKey?: string | null;
  languageName?: string | null;
  languageCode?: string | null;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}