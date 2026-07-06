export class HelperMethods {

  //#region API Errors

  static isBusinessError(error: any): boolean {
    return error?.status === 400;
  }

  static getApiErrorMessage(error: any): string {

    debugger;

    if (!error) {
      return 'Something went wrong.';
    }

    return (
        error.error?.message ??
        error.error?.Message ??
        error.message ??
        'Something went wrong.'
    );
    
  }

  //#endregion


  //#region String

  static isNullOrWhiteSpace(value?: string | null): boolean {
    return !value || value.trim().length === 0;
  }

  //#endregion


  //#region Date

  static toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  //#endregion

}