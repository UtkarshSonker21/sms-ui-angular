export class MasterCurrencyRequest {
  currencyId?: number;
  currencyName: string = '';
  currencyCode: string = '';
  currencySymbol: string = '';
  countryId?: number;
  countryName?: string;
  
  isActive: boolean = true;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}