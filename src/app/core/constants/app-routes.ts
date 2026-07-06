export const AppRoutes = {

  Common: {
    Home: 'home',
    Dashboard: 'dashboard',
    Login: 'login',
    MyProfile: 'my-profile',
    AccessDenied: 'access-denied',

    ForgotUsername: 'forgot-username',
    ForgotPassword: 'forgot-password',
    ResetPassword: 'reset-password',

    LoginWithCode: 'login-with-code'
  },

  Master: {
    Dropdowns: 'dropdowns',
    DropdownValues: 'dropdowns/value',
    Labels: 'labels',
    Countries: 'countries',
    Currencies: 'currencies',
    CurrencyConversion: 'currency-conversion',
    GeneralSettings: 'general-settings'
  },

  Security: {
    Roles: 'roles',
    Menus: 'menus',
    RolePages: 'role-pages',
    UserLoginRole: 'user-login-role',
    LoginLogs: 'login-logs'
  },

  University: {
    Registration: 'university-registration',
    Dashboard: 'university-dashboard',
    
    Courses: 'course-list',
    Faculties: 'faculties',

    Programs: 'programs',
    ProgramDetail: 'programs-detail',
  },

  School: {
    Registration: 'school-registration',
    Dashboard: 'school-dashboard'
  },

  Ngo: {
    Dashboard: 'ngo-dashboard'
  },

  SuperAdmin: {
    Dashboard: 'super-admin-dashboard'
  },

  Marketing: {
    Dashboard: 'marketing-dashboard'
  }

} as const;