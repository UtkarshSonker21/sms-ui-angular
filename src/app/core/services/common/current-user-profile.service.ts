// core/services/common/current-user-profile.service.ts

import { Injectable } from '@angular/core';

import { CurrentUserProfile } from '../../models/common/settings/current-user-profile.model';

@Injectable({
    providedIn: 'root'
})
export class CurrentUserProfileService {

    private currentUserProfile: CurrentUserProfile | null = null;

    setCurrentUserProfile(profile: CurrentUserProfile): void {
        this.currentUserProfile = profile;
    }

    getCurrentUserProfile(): CurrentUserProfile {
        return this.currentUserProfile ?? {} as CurrentUserProfile;
    }

    clear(): void {
        this.currentUserProfile = null;
    }
    
}