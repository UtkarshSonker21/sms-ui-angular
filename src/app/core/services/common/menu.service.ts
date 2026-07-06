import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { CommonService } from './common.service';
import { LoadMenu } from '../../models/common/menu/load-menu.model';


@Injectable({
    providedIn: 'root'
})
export class MenuService {

    private menusSubject = new BehaviorSubject<LoadMenu[]>([]);
    private commonService = inject(CommonService);

    menus$ = this.menusSubject.asObservable();

    loadMenus(): void {
        this.commonService.getAllMenus().subscribe({
            next: res => {
                if (res.success) {
                    this.menusSubject.next(res.result ?? []);
                }
            }
        });
    }

    reloadMenus(): void {
        this.loadMenus();
    }

    
}