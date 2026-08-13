export class LanguageRequestModel {
  languageId: number | null = null;

  languageName: string = '';
  languageCode: string = '';
  cultureCode: string = '';

  isRTL: boolean = false;
  isDefault: boolean = false;
  isActive: boolean = true;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}