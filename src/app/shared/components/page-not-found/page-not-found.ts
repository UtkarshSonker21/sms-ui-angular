import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/common/auth.service';
import { CurrentUserProfileService } from '../../../core/services/common/current-user-profile.service';
import { CurrentUserProfile } from '../../../core/models/common/settings/current-user-profile.model';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.scss',
})
export class PageNotFound {

  private location = inject(Location);
  private authService = inject(AuthService);
  private currentUserProfileService = inject(CurrentUserProfileService);
  currentUser: CurrentUserProfile = new CurrentUserProfile();

  ngOnInit(): void {
    this.currentUser = this.currentUserProfileService.getCurrentUserProfile();
  }

  goToDashboard(): void {
    this.authService.navigateAfterLogin(this.currentUser);
  }

  goBack(): void {
    this.location.back();
  }

}

