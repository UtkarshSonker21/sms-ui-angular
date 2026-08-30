// core/services/common/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AppRoutes } from '../../../core/constants/app-routes';

import { ApiService } from './api.service';
import { StorageService } from './storage.service';

import { ApiEndpoints } from '../../constants/api-endpoints';
import { LOCAL_STORAGE_KEYS } from '../../constants/local-storage-keys';

import { LoginRequest } from '../../models/auth/login-request.model';
import { LoginResponse } from '../../models/auth/login-response.model';
import { ApiResponse } from '../../models/common/response/api-response.model';
import { CurrentUserProfile } from '../../models/common/settings/current-user-profile.model';
import { CurrentUserProfileService } from './current-user-profile.service';
import { UserIdentifier } from '../../models/auth/user-identifier.model';
import { VerifyOtp } from '../../models/auth/verify-otp.model';
import { ResetPasswordRequest } from '../../models/auth/reset-password-request.model';
import { StaffType } from '../../enums/staff-type.enum';
import { UpdateMyProfile } from '../../models/common/settings/update-my-profile-request.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiService = inject(ApiService);
    private storageService = inject(StorageService);
    private currentUserProfileService = inject(CurrentUserProfileService);
    private router = inject(Router);


    // api calls
    login(dto: LoginRequest): Observable<ApiResponse<LoginResponse>> {
        return this.apiService.post<ApiResponse<LoginResponse>>(
            ApiEndpoints.Auth.Login,
            dto
        );
    }

    logoutApi(): Observable<ApiResponse<boolean>> {
        return this.apiService.post<ApiResponse<boolean>>(
            ApiEndpoints.Auth.Logout,
            {}
        );
    }

    getMyProfile(): Observable<ApiResponse<CurrentUserProfile>> {
        return this.apiService.get<ApiResponse<CurrentUserProfile>>(
            ApiEndpoints.Auth.MyProfile
        );
    }


    updateMyProfile(request: UpdateMyProfile): Observable<ApiResponse<boolean>> {
        return this.apiService.post<ApiResponse<boolean>>(
            ApiEndpoints.Auth.UpdateMyProfile,
            request
        );
    }



    forgotUsername(dto: UserIdentifier): Observable<ApiResponse<boolean>> {
        return this.apiService.post<ApiResponse<boolean>>(
            ApiEndpoints.Auth.ForgotUserName,
            dto
        );
    }


    forgotPassword(dto: UserIdentifier): Observable<ApiResponse<boolean>> {
        return this.apiService.post<ApiResponse<boolean>>(
            ApiEndpoints.Auth.ForgotPassword,
            dto
        );
    }

    resetPassword(dto: ResetPasswordRequest): Observable<ApiResponse<boolean>> {
        return this.apiService.post<ApiResponse<boolean>>(
            ApiEndpoints.Auth.ResetPassword,
            dto
        );
    }

    loginWithCode(dto: UserIdentifier): Observable<ApiResponse<boolean>> {
        return this.apiService.post<ApiResponse<boolean>>(
            ApiEndpoints.Auth.LoginWithCode,
            dto
        );
    }

    verifyLoginCode(dto: VerifyOtp): Observable<ApiResponse<LoginResponse>> {
        return this.apiService.post<ApiResponse<LoginResponse>>(
            ApiEndpoints.Auth.VerifyLoginCode,
            dto
        );
    }


    switchRole(roleId: number): Observable<ApiResponse<LoginResponse>> {
        return this.apiService.post<ApiResponse<LoginResponse>>(
            `${ApiEndpoints.Auth.SwitchRole}?roleId=${roleId}`,
            null
        );
    }

    // public helper methods 
    public logout(): void {
        this.logoutApi().subscribe({
            next: () => this.finishLogout(),
            error: () => this.finishLogout()
        });
    }

    public isUserLoggedIn(): boolean {

        const token = this.getToken();

        if (!token) {
            return false;
        }

        return !this.isTokenExpired();
    }

    public saveLoginData(loginResponse: LoginResponse, rememberMe: boolean): void {

        if (rememberMe) {

            // Token
            this.storageService.setTokenPersistent(
                loginResponse.token
            );

            // Expiry
            this.storageService.setTokenExpiryPersistent(
                new Date(loginResponse.expiry).getTime()
            );

        } else {

            // token
            this.storageService.setTokenSession(
                loginResponse.token
            );

            // Expiry
            this.storageService.setTokenExpirySession(
                new Date(loginResponse.expiry).getTime()
            );
        }
    }

    public loadCurrentUser(rememberMe: boolean): void {

        this.getMyProfile().subscribe(
            response => {
                if (response.success && response.result) {

                    // store users in session 
                    if (rememberMe) {
                        this.storageService.setCurrentUserPersistent(
                            response.result
                        );
                    } else {
                        this.storageService.setCurrentUserSession(
                            response.result
                        );
                    }

                    // load users in memory 
                    this.currentUserProfileService.setCurrentUserProfile(response.result);

                    // navigation after login 
                    this.navigateAfterLogin(response.result);
                }
            }
        );
    }

    public navigateAfterLogin(user: CurrentUserProfile): void {

        switch (user.staffType) {

            case StaffType.University:
                this.router.navigate([AppRoutes.University.Dashboard]);
                break;

            case StaffType.School:
                this.router.navigate([AppRoutes.School.Dashboard]);
                break;

            case StaffType.Ngo:
                this.router.navigate([AppRoutes.Ngo.Dashboard]);
                break;

            case StaffType.SuperAdmin:
                this.router.navigate([AppRoutes.SuperAdmin.Dashboard]);
                break;

            case StaffType.Marketing:
                this.router.navigate([AppRoutes.Marketing.Dashboard]);
                break;

            default:
                this.router.navigate([AppRoutes.Common.Dashboard]);
                break;
        }

        //this.router.navigate([AppRoutes.Common.Dashboard]);
    }


    public handleApplicationStartup(): void {

        if (!this.isUserLoggedIn()) {
            return;
        }

        const currentUser = this.currentUserProfileService.getCurrentUserProfile();

        if (!currentUser?.staffType) {
            return;
        }

        this.navigateAfterLogin(currentUser);
    }

    // private helper methods 

    private finishLogout(): void {
        this.clearUserSession();
        this.router.navigate(['/login']);
    }

    private clearUserSession(): void {
        this.storageService.clearAuthData();
    }

    private isTokenExpired(): boolean {

        const expiry = this.storageService.getTokenExpiry();

        if (!expiry) {
            return true;
        }

        return Date.now() >= expiry;
    }

    private getToken(): string | null {
        return this.storageService.getToken();
    }


}