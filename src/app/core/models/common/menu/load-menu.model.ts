import { MenuPermission } from './menu-permission.model';

export class LoadMenu {

  menuLinkId: number = 0;

  pageHeading: string = '';

  actualName: string = '';

  pagePath: string = '';

  isDashboard: boolean = false;

  sequenceNo: number = 0;

  permissions: MenuPermission = new MenuPermission();

  moduleId: number = 0;

  icon?: string;

  subMenus: LoadMenu[] = [];

  get hasAccess(): boolean {
    return this.permissions.canView;
  }

}