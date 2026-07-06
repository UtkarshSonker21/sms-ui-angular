import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { inject } from '@angular/core';
import { ApiEndpoints } from '../,,/../constants/api-endpoints';

import { LoadingService } from '../services/common/loading.service';

export const loadingInterceptor: HttpInterceptorFn =
  (req, next) => {

    const loadingService = inject(LoadingService);



    // Endpoints that should NOT show the loader
    const ignoredEndpoints = [

      ApiEndpoints.Auth.Login,
      ApiEndpoints.Auth.Logout,

      ApiEndpoints.Auth.ForgotUserName,
      ApiEndpoints.Auth.ForgotPassword,

      ApiEndpoints.Auth.ResetPassword,

      ApiEndpoints.Auth.LoginWithCode,
      ApiEndpoints.Auth.VerifyLoginCode,

      //ApiEndpoints.Auth.MyProfile

    ];

    const shouldIgnore = ignoredEndpoints.some(endpoint =>
      req.url.includes(endpoint)
    );

    if (shouldIgnore) {
      return next(req);
    }


    loadingService.show();

    return next(req).pipe(
      finalize(() => loadingService.hide())
    );

  };