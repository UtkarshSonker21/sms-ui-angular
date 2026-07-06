export const LOCAL_STORAGE_KEYS = {

  AUTH: {
    TOKEN: 'AuthToken',
    TOKEN_EXPIRY: 'TokenExpiry'
  },

  USER: {
    LOGIN_ID: 'LoginId',
    LOGIN_NAME: 'LoginName',

    MODULE_ID: 'ModuleId',
    MODULE_NAME: 'ModuleName',

    STAFF_TYPE: 'StaffType',

    CURRENT_ROLE_ID: 'CurrentRoleId',
    CURRENT_ROLE_NAME: 'CurrentRoleName',

    AVAILABLE_ROLES: 'AvailableRoles'
  },

  APP: {
    TRANSLATIONS: 'app_translations_'
  }

} as const;