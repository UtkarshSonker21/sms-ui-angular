import { AvailableRole } from '../common/settings/available-role.model';

export interface LoginResponse {
  // Auth
  token: string;
  expiry: string;

  // User Identity
  loginId: number;
  loginName: string;

  // Module Context
  moduleId: number;
  moduleName: string;

  // Role Context
  currentRoleId: number;
  currentRoleName: string;

  availableRoles: AvailableRole[];
}