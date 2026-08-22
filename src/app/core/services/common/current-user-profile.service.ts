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

        // persist entire profile
        this.storageService.setItem(
            LOCAL_STORAGE_KEYS.USER.CURRENT_USER,
            profile
        );
    }

    getCurrentUserProfile(): CurrentUserProfile {
        return this.currentUserProfile ?? {} as CurrentUserProfile;
    }

    clear(): void {
        this.currentUserProfile = null;

        // remove persisted profile
        this.storageService.removeItem(
            LOCAL_STORAGE_KEYS.USER.CURRENT_USER
        );
    }

    private loadFromStorage(): void {
        
        const storedProfile =
            this.storageService.getItem<CurrentUserProfile>(
                LOCAL_STORAGE_KEYS.USER.CURRENT_USER
            );

        if (storedProfile) {
            this.currentUserProfile = storedProfile;
        }
    }


}