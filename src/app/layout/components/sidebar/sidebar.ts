import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotificationService } from '../../../core/services/common/notification.service';
import { CommonService } from '../../../core/services/common/common.service';
import { LoadMenu } from '../../../core/models/common/menu/load-menu.model';
import { MenuService } from '../../../core/services/common/menu.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  private commonService = inject(CommonService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loadMenus: LoadMenu[] = [];
  private menuService = inject(MenuService);

  ngOnInit(): void {
    //this.loadAllMenus();

    this.menuService.menus$.subscribe(menus => {
      this.loadMenus = menus;
      this.cdr.detectChanges();
    });

    this.menuService.loadMenus();

  }

  /**
   * Fetches the menu items from the API via the CommonService.
   */
  loadAllMenus(): void {
    this.commonService.getAllMenus().subscribe({
      next: (response) => {
        if (!response.success || !response.result) {
          return;
        }
        this.loadMenus = response.result;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error('Failed to load sidebar menu');
        console.error('Error loading menus:', err);
      }
    });
  }

  /**
   * Maps backend Material Icon names to Font Awesome 7 icon classes.
   * 
   * Examples:
   * - 'dashboard' -> 'fa-table-columns'
   * - 'auto_stories' -> 'fa-book-open'
   * - 'fact_check' -> 'fa-building-columns'
   * 
   * @param materialIcon The icon name returned by the backend API.
   * @returns The full Font Awesome CSS class string.
   */
  mapIcon(materialIcon: string | undefined): string {
    if (!materialIcon) {
      return 'fa-solid fa-circle-question';
    }

    const cleanedIcon = materialIcon.toLowerCase().trim();

    // Map of Material Icon names to Font Awesome 7 equivalents
    const iconMap: Record<string, string> = {
      'dashboard': 'fa-table-columns',
      'auto_stories': 'fa-book-open',
      'fact_check': 'fa-building-columns',

      // Additional fallback mappings for enterprise robustness
      'home': 'fa-house',
      'settings': 'fa-gear',
      'person': 'fa-user',
      'group': 'fa-users',
      'school': 'fa-graduation-cap',
      'assignment': 'fa-clipboard-list',
      'analytics': 'fa-chart-line'
    };

    const faIcon = iconMap[cleanedIcon] || `fa-${cleanedIcon}`;
    return `fa-solid ${faIcon}`;
  }

  /**
   * Checks if a menu item should display a badge, and returns its value.
   * For pixel-perfect match with the Blazor reference, 'Faculties & Programs' has a badge value of '4'.
   * 
   * @param item The menu item to check.
   * @returns The badge string, or null if no badge should be displayed.
   */
  getBadgeValue(item: LoadMenu): string | null {
    if (item.pageHeading === 'Faculties & Programs') {
      return '4';
    }
    return null;
  }

}
