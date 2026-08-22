import { Injectable } from '@angular/core';
import { LOCAL_STORAGE_KEYS } from '../../constants/local-storage-keys';


@Injectable({
  providedIn: 'root'
})
export class StorageService {


  // JWT token methods -- at a time only one token would be there 
  // Ensures only ONE active token at a time.
  // When storing in one storage, the other is cleared to avoid conflicts.


  // ==========================
  // TOKEN METHODS
  // ==========================

  // Remember Me = TRUE → localStorage → Save permanently
  setTokenPersistent(token: string): void {

    localStorage.setItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN,
      token
    );

    sessionStorage.removeItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN
    );
  }


  // Remember Me = FALSE → sessionStorage → Save temporarily
  setTokenSession(token: string): void {

    sessionStorage.setItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN,
      token
    );

    localStorage.removeItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN
    );
  }


  // Auto-detect token from either storage
  // Always prefer session token (active role) over persistent token
  getToken(): string | null {

    const sessionToken =
      sessionStorage.getItem(
        LOCAL_STORAGE_KEYS.AUTH.TOKEN
      );

    if (sessionToken) {
      return sessionToken;
    }

    return localStorage.getItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN
    );
  }

  // Clear token from both storages
  removeToken(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH.TOKEN);
    sessionStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH.TOKEN);
  }


  // ==========================
  // GENERIC STORAGE
  // ==========================

  setItem(key: string, value: any): void {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  }

  getItem<T>(key: string): T | null {

    const value = localStorage.getItem(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // ==========================
  // AUTH DATA
  // ==========================

  clear(): void {
    localStorage.clear();
    sessionStorage.clear();
  }

  clearAuthData(): void {

    this.removeToken();

    this.removeItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY
    );

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER
    );

    // used to clear user profile
    // this.clearLegacyUserData();

  }

  private clearLegacyUserData(): void {

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.LOGIN_ID
    );

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.LOGIN_NAME
    );

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.MODULE_ID
    );

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.MODULE_NAME
    );

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_ROLE_ID
    );

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_ROLE_NAME
    );

    this.removeItem(
      LOCAL_STORAGE_KEYS.USER.AVAILABLE_ROLES
    );
  }

}