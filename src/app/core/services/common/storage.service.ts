import { Injectable } from '@angular/core';
import { LOCAL_STORAGE_KEYS } from '../../constants/local-storage-keys';
import { CurrentUserProfile } from '../../models/common/settings/current-user-profile.model';


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
  // CURRENT USER METHODS
  // ==========================

  // Remember Me = TRUE → localStorage
  setCurrentUserPersistent(profile: CurrentUserProfile): void {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER,
      JSON.stringify(profile)
    );

    sessionStorage.removeItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER
    );
  }

  // Remember Me = FALSE → sessionStorage
  setCurrentUserSession(profile: CurrentUserProfile): void {
    sessionStorage.setItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER,
      JSON.stringify(profile)
    );

    localStorage.removeItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER
    );
  }

  getCurrentUser<T>(): T | null {
    const sessionUser = sessionStorage.getItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER
    );

    if (sessionUser) {
      return JSON.parse(sessionUser);
    }

    const localUser = localStorage.getItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER
    );

    return localUser ? JSON.parse(localUser) : null;
  }

  removeCurrentUser(): void {
    localStorage.removeItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER
    );

    sessionStorage.removeItem(
      LOCAL_STORAGE_KEYS.USER.CURRENT_USER
    );
  }



  // ==========================
  // TOKEN EXPIRY METHODS
  // ==========================

  // Remember Me = TRUE → localStorage
  setTokenExpiryPersistent(expiry: number): void {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY,
      expiry.toString()
    );

    sessionStorage.removeItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY
    );
  }

  // Remember Me = FALSE → sessionStorage
  setTokenExpirySession(expiry: number): void {
    sessionStorage.setItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY,
      expiry.toString()
    );

    localStorage.removeItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY
    );
  }

  getTokenExpiry(): number | null {
    const sessionExpiry = sessionStorage.getItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY
    );

    if (sessionExpiry) {
      return Number(sessionExpiry);
    }

    const localExpiry = localStorage.getItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY
    );

    return localExpiry ? Number(localExpiry) : null;
  }

  removeTokenExpiry(): void {
    localStorage.removeItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY
    );

    sessionStorage.removeItem(
      LOCAL_STORAGE_KEYS.AUTH.TOKEN_EXPIRY
    );
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

  clearAuthData(): void {
    this.removeToken();
    this.removeTokenExpiry();
    this.removeCurrentUser();
  }


  // ==========================
  // CLEAR ALL STORAGE
  // ==========================

  clear(): void {
    localStorage.clear();
    sessionStorage.clear();
  }



}