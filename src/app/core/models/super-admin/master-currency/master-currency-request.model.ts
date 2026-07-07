export class MasterCurrencyRequest {
  currencyId?: number;
  currencyName: string = '';
  currencyCode: string = '';
  currencySymbol: string = '';
  currencyFracUnit?: string;
  isActive: boolean = true;
  createdDate: Date = new Date();
}