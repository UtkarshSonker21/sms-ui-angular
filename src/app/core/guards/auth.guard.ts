import { CanActivateFn, Router } from "@angular/router";
import { AppRoutes } from "../constants/app-routes";
import { inject } from "@angular/core";
import { AuthService } from "../services/common/auth.service";

export const authGuard: CanActivateFn = () => {

    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isUserLoggedIn()) {
        return true;
    }

    authService.logout();
    return router.createUrlTree([AppRoutes.Common.Login]);
};