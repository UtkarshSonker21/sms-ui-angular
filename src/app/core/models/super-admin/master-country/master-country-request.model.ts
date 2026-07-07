export class MasterCountryRequest {
  countryId?: number;
  countryName: string = '';
  countryIsdCode: number = 0;
  countryAlphaCode3?: string;
  currencyName?: string;
  currencyFracUnit?: string;
  currencySymbol?: string;
  currencyAbb?: string;
  isActive: boolean = true;
}