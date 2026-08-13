export class LocalizationModel {
  languageId: number = 0;
  languageCode: string = '';
  cultureCode: string = '';
  isRTL: boolean = false;
  translations: { [key: string]: string } = {};
}