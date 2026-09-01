import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CurrentUserProfile } from '../../../core/models/common/settings/current-user-profile.model';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { AuthService } from '../../../core/services/common/auth.service';
import { AppRoutes } from '../../../core/constants/app-routes';
import { NotificationService } from '../../../core/services/common/notification.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/local-storage-keys';
import { AvailableRole } from '../../../core/models/common/settings/available-role.model';
import { MenuService } from '../../../core/services/common/menu.service';
import { LanguageService } from '../../../core/services/superadmin/language.service';
import { LocalizationService } from '../../../core/services/superadmin/localization.service';
import { LanguageFilterModel } from '../../../core/models/super-admin/language/language-filter.model';

import { CommonService } from '../../../core/services/common/common.service';
import { GlobalSearchRequest } from '../../../core/models/common/global-search/global-search-request.model';
import { GlobalSearchSection } from '../../../core/models/common/global-search/global-search-section.model';
import { GlobalSearchItem } from '../../../core/models/common/global-search/global-search-item.model';
import { StaffType } from '../../../core/enums/staff-type.enum';

import { DisableAutocompleteDirective } from '../../../shared/directives/disable-autocomplete.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule, DisableAutocompleteDirective],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {

  private currentUserProfileService = inject(CurrentUserProfileService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private storageService = inject(StorageService);
  private elementRef = inject(ElementRef);
  private menuService = inject(MenuService);
  private languageService = inject(LanguageService);
  private localizationService = inject(LocalizationService);
  private commonService = inject(CommonService);

  currentUser: CurrentUserProfile = new CurrentUserProfile();
  availableRoles: AvailableRole[] = [];

  isProfileDropdownOpen = false;
  isLanguageDropdownOpen = false;
  isRolesSectionExpanded = false;
  selectedLanguage: string = '';

  languages: any[] = [];

  // Global Search State
  searchQuery: string = '';
  isSearching: boolean = false;
  isSearchOpen: boolean = false;
  searchSections: GlobalSearchSection[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  get showGlobalSearch(): boolean {
    const user = this.currentUserProfileService.getCurrentUserProfile();
    const staffType = user?.staffType ?? this.currentUser?.staffType;
    return staffType !== StaffType.SuperAdmin;
  }

  ngOnInit(): void {
    this.currentUser = this.currentUserProfileService.getCurrentUserProfile();
    this.availableRoles = this.storageService.getItem<AvailableRole[]>(LOCAL_STORAGE_KEYS.USER.AVAILABLE_ROLES) || [];
    this.loadLanguages();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((text) => {
        if (!text || !text.trim()) {
          this.isSearching = false;
          this.searchSections = [];
          return of(null);
        }
        const req = new GlobalSearchRequest();
        req.searchText = text.trim();
        req.limit = 10;
        return this.commonService.searchGlobal(req).pipe(
          catchError(() => {
            return of(null);
          })
        );
      })
    ).subscribe((response) => {
      this.isSearching = false;
      if (response && response.success && response.result) {
        this.searchSections = response.result.sections || [];
      } else if (response !== null) {
        this.searchSections = [];
      }
      this.cdr.markForCheck();
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isProfileDropdownOpen = false;
      this.isLanguageDropdownOpen = false;
      this.isRolesSectionExpanded = false;
      this.isSearchOpen = false;
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadLanguages(): void {
    const filter = new LanguageFilterModel();
    filter.pageNumber = 1;
    filter.pageSize = 100;
    
    this.languageService.getLanguages(filter).subscribe({
      next: (response) => {
        if (response.success && response.result && response.result.items.length > 0) {
          this.languages = response.result.items.map(lang => ({
            code: lang.languageCode,
            name: lang.languageName
          }));

          const savedLang = localStorage.getItem('selectedLanguage');
          if (savedLang && this.languages.some(l => l.code === savedLang)) {
            this.selectedLanguage = savedLang;
          } else {
            this.selectedLanguage = this.languages[0].code;
            localStorage.setItem('selectedLanguage', this.selectedLanguage);
          }
          this.localizationService.loadTranslations(this.selectedLanguage).subscribe();
        }
      }
    });
  }

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
    this.isSearchOpen = false;
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
    this.isProfileDropdownOpen = false;
    this.isSearchOpen = false;
  }

  toggleRolesSection(event: Event): void {
    event.stopPropagation();
    this.isRolesSectionExpanded = !this.isRolesSectionExpanded;
  }

  onSearchInput(value: string): void {
    const trimmed = value ? value.trim() : '';
    if (!trimmed) {
      this.isSearching = false;
      this.searchSections = [];
      this.isSearchOpen = false;
      return;
    }
    this.isSearchOpen = true;
    this.isSearching = true;
    this.searchSubject.next(trimmed);
  }

  onSearchFocus(): void {
    if (this.searchQuery && this.searchQuery.trim().length > 0) {
      this.isSearchOpen = true;
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSections = [];
    this.isSearchOpen = false;
    this.isSearching = false;
  }

  onItemClick(item: GlobalSearchItem): void {
    if (item.route) {
      this.isSearchOpen = false;
      this.router.navigateByUrl(item.route);
    }
  }

  get hasResults(): boolean {
    return this.searchSections.some(s => s.items && s.items.length > 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const searchContainer = this.elementRef.nativeElement.querySelector('.header__search-container');
    if (searchContainer && !searchContainer.contains(target)) {
      this.isSearchOpen = false;
    }
    if (!this.elementRef.nativeElement.contains(target)) {
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
        this.authService.loadCurrentUser(false);

      },
    });
  }

  changeLanguage(languageCode: string): void {
    this.selectedLanguage = languageCode;
    localStorage.setItem('selectedLanguage', languageCode);
    this.localizationService.loadTranslations(languageCode).subscribe();
  }

  openNotifications(): void {
    // Method created and left empty per instructions.
  }

  logout(): void {
    this.authService.logout();
  }

  goBackToMyProfile(): void {
    this.isProfileDropdownOpen = false;
    this.isRolesSectionExpanded = false;
    this.router.navigate([AppRoutes.Common.MyProfile]);
  }

  goBackToLogin(): void {
    this.router.navigate([AppRoutes.Common.Login]);
  }


  
}

