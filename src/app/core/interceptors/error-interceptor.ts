// core/interceptors/error-interceptor.ts

import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../../core/services/common/notification.service';
import { AuthService } from '../../core/services/common/auth.service';
import { ApiEndpoints } from '../constants/api-endpoints';

export const errorInterceptor: HttpInterceptorFn =
  (req, next) => {

    const notification = inject(NotificationService);
    const authService = inject(AuthService);

    // Endpoints that should NOT show the loader
    const ignoredErrorEndpoints = [

      ApiEndpoints.Auth.Login,
      ApiEndpoints.Auth.Logout,
      ApiEndpoints.Auth.ForgotUserName,
      ApiEndpoints.Auth.ForgotPassword,
      ApiEndpoints.Auth.ResetPassword,
      ApiEndpoints.Auth.LoginWithCode,
      ApiEndpoints.Auth.VerifyLoginCode,
    ];

    return next(req).pipe(

      catchError(error => {

        // console.error('API Error:', error);

        if (ignoredErrorEndpoints.some(endpoint => req.url.includes(endpoint))) {
          return throwError(() => error);
        }

        switch (error.status) {

          case 0:
            notification.error('Network connection problem');
            break;


          case 400:
            // Business validation.
            // Let the component handle it.
            break;

          case 401:
            if (authService.isUserLoggedIn()) {
              authService.logout();
              notification.error('Your session has expired.');
            }
            break;

          case 403:
            notification.error('Access denied.');
            break;

          case 404:
            notification.error('Resource not found.');
            break;

          case 500:
            notification.error('Internal server error.');
            break;

          default:
            notification.error('Something went wrong.');
            break;
        }

        return throwError(() => error);
      })
    );
  };