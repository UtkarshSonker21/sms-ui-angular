export class MarketingAdministrativeFeeHistory {
  marketingAdministrativeFeeId: number = 0;

  feePercentage: number = 0;

  isCurrent: boolean = false;

  createdBy: number = 0;
  createdByName: string = '';

  createdDate!: Date;

  updatedBy?: number;
  updatedByName?: string;

  updatedDate?: Date;

  effectiveFrom?: Date;
  effectiveTo?: Date;
}