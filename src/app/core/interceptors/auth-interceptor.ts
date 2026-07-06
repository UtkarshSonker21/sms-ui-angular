// core/interceptors/auth-interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { StorageService } from '../services/common/storage.service';
import { LOCAL_STORAGE_KEYS } from '../constants/local-storage-keys';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const storageService = inject(StorageService);

  const token = storageService.getToken();

  if (!token) {
    return next(req);
  }

  const authRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authRequest);
};