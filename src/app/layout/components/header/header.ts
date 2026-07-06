import { Component, inject, OnInit, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CurrentUserProfile } from '../../../core/models/common/settings/current-user-profile.model';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { AuthService } from '../../../core/services/common/auth.service';
import { AppRoutes } from '../../../core/constants/app-routes';
import { NotificationService } from '../../../core/services/common/notification.service';
import { LanguageCode } from '../../../core/enums/language-code.enum';
import { StorageService } from '../../../core/services/common/storage.service';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/local-storage-keys';
import { AvailableRole } from '../../../core/models/common/settings/available-role.model';
import { MenuService } from '../../../core/services/common/menu.service';

import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, DisableAutocompleteDirective],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {

  private currentUserProfileService = inject(CurrentUserProfileService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private storageService = inject(StorageService);
  private elementRef = inject(ElementRef);
  private menuService = inject(MenuService);

  currentUser: CurrentUserProfile = new CurrentUserProfile();
  availableRoles: AvailableRole[] = [];

  isProfileDropdownOpen = false;
  isLanguageDropdownOpen = false;
  isRolesSectionExpanded = false;
  selectedLanguage: LanguageCode = LanguageCode.En;

  ngOnInit(): void {
    this.currentUser = this.currentUserProfileService.getCurrentUserProfile();
    this.availableRoles = this.storageService.getItem<AvailableRole[]>(LOCAL_STORAGE_KEYS.USER.AVAILABLE_ROLES) || [];
  }


  readonly languages = [
    { code: LanguageCode.En, name: 'English' },
    { code: LanguageCode.Ar, name: 'Arabic' }
  ];


  get userInitials(): string {
    if (!this.currentUser) return 'U';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return (this.currentUser.firstName.charAt(0) + this.currentUser.lastName.charAt(0)).toUpperCase();
    }

    if (this.currentUser.fullName) {
      const parts = this.currentUser.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      }
      if (parts.length > 0 && parts[0].length > 0) {
        return parts[0].charAt(0).toUpperCase();
      }
    }

    if (this.currentUser.loginName) {
      return this.currentUser.loginName.charAt(0).toUpperCase();
    }

    return 'U';
  }

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    this.isLanguageDropdownOpen = false;
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
    this.isProfileDropdownOpen = false;
  }

  toggleRolesSection(event: Event): void {
    event.stopPropagation();
    this.isRolesSectionExpanded = !this.isRolesSectionExpanded;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isProfileDropdownOpen = false;
      this.isLanguageDropdownOpen = false;
      this.isRolesSectionExpanded = false;
    }
  }

  switchRole(roleId: number): void {
    this.authService.switchRole(roleId).subscribe({
      next: response => {
        this.cdr.detectChanges();
        if (!response.success || !response.result) {
          this.notification.error(response.message);
          return;
        }

        // call menu after successfull role change
        this.menuService.reloadMenus();
        // Role switching is temporary.
        // Always save in session storage (rememberMe = false).
        this.authService.saveLoginData(response.result, false);
        this.authService.loadCurrentUser();

      },
    });
  }

  changeLanguage(language: LanguageCode): void {
    // Method created and left empty per instructions.
  }

  openNotifications(): void {
    // Method created and left empty per instructions.
  }

  logout(): void {
    this.authService.logout();
  }

  goBackToMyProfile(): void {
    this.router.navigate([AppRoutes.Common.MyProfile]);
  }

  goBackToLogin(): void {
    this.router.navigate([AppRoutes.Common.Login]);
  }


}

