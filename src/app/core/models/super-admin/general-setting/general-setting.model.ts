export class GeneralSettingModel {
  configId: number | null = null;

  configKey: string = '';
  configValue: string = '';
  configDescription: string | null = null;

  isActive: boolean = true;

  // Audit
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}