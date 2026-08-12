export class GeneralSettingModel {
  configId: number | null = null;

  configKey: string = '';
  configValue: string = '';
  configDescription: string | null = null;

  isActive: boolean = true;

  createdDate: Date | null = null;
  createdBy: number = 0;

  updatedDate: Date | null = null;
  updatedBy: number | null = null;

  createdByName: string | null = null;
  updatedByName: string | null = null;
}