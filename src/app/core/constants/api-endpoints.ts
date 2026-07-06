export const ApiEndpoints = {

  Auth: {
    Login: 'auth/login',
    Logout: 'auth/logout',

    SwitchRole: 'auth/switch-role',

    ForgotUserName: 'auth/forgot-username',
    ForgotPassword: 'auth/forgot-password',

    ResetPassword: 'auth/reset-password',
    ResetUsername: 'auth/reset-username',

    LoginWithCode: 'auth/login-with-code',
    VerifyLoginCode: 'auth/verify-login-code',

    MyProfile: 'auth/my-profile',
  },

  Common: {
    UsersModule: 'common/user-modules',
    LoadMenus: 'common/load-menus',
    Dashboard: 'common/load-dashboard',
    UpdateMyProfile: 'auth/update/my-profile'
  },


  SuperAdmin: {

    MasterDropDown: {
      Search: 'superadmin/master-dropdown/search',
      GetById: 'superadmin/master-dropdown/getById',
      Create: 'superadmin/master-dropdown/create',
      Update: 'superadmin/master-dropdown/update',
      Delete: 'superadmin/master-dropdown/delete',
      GetByParentId: 'superadmin/master-dropdown/getByParentId',
    }

  },

  Ngo: {

    SponsorshipTypes: {
      Search: 'ngo/sponsorship-types/search',
      GetById: 'ngo/sponsorship-types/getById',
      Create: 'ngo/sponsorship-types/create',
      Update: 'ngo/sponsorship-types/update',
      Delete: 'ngo/sponsorship-types/delete'
    },

  },

  University: {

    Courses: {
      Search: 'university/courses/search',
      GetById: 'university/courses/getById',
      Create: 'university/courses/create',
      Update: 'university/courses/update',
      Delete: 'university/courses/delete'
    },

    Faculties: {
      FacultyPrograms: 'university/faculties/faculty-programs',
      Search: 'university/faculties/search',
      GetById: 'university/faculties/getById',
      Create: 'university/faculties/create',
      Update: 'university/faculties/update',
      Delete: 'university/faculties/delete'
    },

    Programs: {
      Search: 'university/programs/search',
      GetById: 'university/programs/getById',
      Create: 'university/programs/create',
      Update: 'university/programs/update',
      Delete: 'university/programs/delete'
    },

    DocumentTypes: {
      Search: 'university/document-types/search',
      GetById: 'university/document-types/getById',
      Create: 'university/document-types/create',
      Update: 'university/document-types/update',
      Delete: 'university/document-types/delete'
    }

  }

} as const;
