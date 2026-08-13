export class LanguageTranslationItemModel {
  translationId?: number;

  languageId: number = 0;
  languageName: string = '';
  languageCode: string = '';

  value?: string | null;

  isTranslated: boolean = false;
}