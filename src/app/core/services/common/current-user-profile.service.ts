// core/services/common/current-user-profile.service.ts

import { inject, Injectable } from '@angular/core';

import { CurrentUserProfile } from '../../models/common/settings/current-user-profile.model';
import { StorageService } from './storage.service';
import { LOCAL_STORAGE_KEYS } from '../../constants/local-storage-keys';

@Injectable({
    providedIn: 'root'
})
export class CurrentUserProfileService {

    private storageService = inject(StorageService);
    private currentUserProfile: CurrentUserProfile | null = null;

    constructor() {
        this.loadFromStorage();
    }

    setCurrentUserProfile(profile: CurrentUserProfile): void {
        this.currentUserProfile = profile;
    }

    getCurrentUserProfile(): CurrentUserProfile {
        return this.currentUserProfile ?? {} as CurrentUserProfile;
    }

    clear(): void {
        this.currentUserProfile = null;

        // remove current user profile
        this.storageService.removeCurrentUser();
    }

    private loadFromStorage(): void {
        
        const storedProfile = this.storageService.getCurrentUser<CurrentUserProfile>();

        if (storedProfile) {
            this.currentUserProfile = storedProfile;
        }
    }


}