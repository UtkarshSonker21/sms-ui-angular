import { environment } from '../../../environments/environment';

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


  //#region URL & File Helpers

  static getFileUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }

    const apiBase = environment.apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const relativePath = path.startsWith('/') ? path : '/' + path;
    return `${apiBase}${relativePath}`;
  }

  //#endregion

}