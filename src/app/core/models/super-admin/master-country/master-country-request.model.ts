export class MasterCountryRequest {
  countryId?: number;
  countryName: string = '';
  countryIsdCode: number = 0;
  countryAlphaCode3?: string;


  isActive: boolean = true;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;

}