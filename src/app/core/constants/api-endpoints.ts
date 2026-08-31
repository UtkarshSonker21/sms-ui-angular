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

    UpdateMyProfile: 'auth/update/my-profile',
  },

  Common: {
    UsersModule: 'common/user-modules',
    LoadMenus: 'common/load-menus',
    Dashboard: 'common/load-dashboard',
    UpdateMyProfile: 'auth/update/my-profile',

    // Marketing Administrative Fee
    MarketingAdministrativeFee: {
      GetCurrent: 'common/marketing-administrative-fee/current',
      Update: 'common/marketing-administrative-fee/update',
      GetHistory: 'common/marketing-administrative-fee/history'
    },

  },

  SuperAdmin: {

    MasterDropDown: {
      Search: 'superadmin/master-dropdown/search',
      GetById: (id: number) => `superadmin/master-dropdown/getById/${id}`,
      GetByParentId: (parentId: number) => `superadmin/master-dropdown/getByParentId/${parentId}`,
      Create: 'superadmin/master-dropdown/create',
      Update: (id: number) => `superadmin/master-dropdown/update/${id}`,
      Delete: (id: number) => `superadmin/master-dropdown/delete/${id}`
    },

    MasterCountry: {
      Search: 'superadmin/master-country/search',
      GetById: (id: number) => `superadmin/master-country/getById/${id}`,
      Create: 'superadmin/master-country/create',
      Update: (id: number) => `superadmin/master-country/update/${id}`,
      Delete: (id: number) => `superadmin/master-country/delete/${id}`
    },

    MasterCurrency: {
      Search: 'superadmin/master-currency/search',
      GetById: (id: number) => `superadmin/master-currency/getById/${id}`,
      Create: 'superadmin/master-currency/create',
      Update: (id: number) => `superadmin/master-currency/update/${id}`,
      Delete: (id: number) => `superadmin/master-currency/delete/${id}`
    },

    Staff: {
      Create: 'common/staff/create',
      Update: (staffId: number) => `common/staff/update/${staffId}`,
      Delete: (staffId: number) => `common/staff/delete/${staffId}`,
      GetById: (staffId: number) => `common/staff/getById/${staffId}`,
      Search: 'common/staff/search'
    },

    UsersMenu: {
      Search: 'superadmin/users-menu/search',
      GetById: (menuLinkId: number) => `superadmin/users-menu/getById/${menuLinkId}`,
      Create: 'superadmin/users-menu/create',
      Update: (menuLinkId: number) => `superadmin/users-menu/update/${menuLinkId}`,
      Delete: (menuLinkId: number) => `superadmin/users-menu/delete/${menuLinkId}`
    },

    UsersRole: {
      Create: 'superadmin/users-role/create',
      Update: (id: number) => `superadmin/users-role/update/${id}`,
      Delete: (id: number) => `superadmin/users-role/delete/${id}`,
      GetById: (id: number) => `superadmin/users-role/getById/${id}`,
      Search: 'superadmin/users-role/search',
      GetByModules: 'superadmin/users-role/get-by-modules'
    },


    UsersRoleAssignment: {
      GetRoleAssignments: 'superadmin/users-role-assignment/login-roles',
      BulkSave: 'superadmin/users-role-assignment/bulk-save'
    },

    UsersLogin: {
      GetById: (id: number) => `superadmin/users-login/getById/${id}`,
      Search: `superadmin/users-login/search`
    },

    UsersRolePermission: {
      GetRolePermissions: 'superadmin/users-role-permission/search',
      BulkSave: 'superadmin/users-role-permission/bulk-save'
    },

    GeneralSettings: {
      Create: 'superadmin/general-settings/create',
      Update: (id: number) => `superadmin/general-settings/update/${id}`,
      Delete: (id: number) => `superadmin/general-settings/delete/${id}`,
      GetById: (id: number) => `superadmin/general-settings/getById/${id}`,
      Search: 'superadmin/general-settings/search'
    },

    Language: {
      Search: 'superadmin/languages/search',
      GetById: (id: number) => `superadmin/languages/getById/${id}`,
      Create: 'superadmin/languages/create',
      Update: (id: number) => `superadmin/languages/update/${id}`,
      Delete: (id: number) => `superadmin/languages/delete/${id}`
    },

    Labels: {
      Search: 'superadmin/labels/search',
      GetById: (id: number) => `superadmin/labels/getById/${id}`,
      Create: 'superadmin/labels/create',
      Update: (id: number) => `superadmin/labels/update/${id}`,
      Delete: (id: number) => `superadmin/labels/delete/${id}`
    },

    LanguageTranslations: {
      Search: 'superadmin/language-translations/search',
      GetById: (id: number) => `superadmin/language-translations/getById/${id}`,
      Create: 'superadmin/language-translations/create',
      Update: (id: number) => `superadmin/language-translations/update/${id}`,
      Delete: (id: number) => `superadmin/language-translations/delete/${id}`,
      ManagementSearch: 'superadmin/language-translations/management/search'
    },

    Localization: {
      GetTranslations: (languageCode: string) => `localization/${languageCode}`
    },

    UsersLoginLog:{
      Search: 'superadmin/users-login-log/search',
      GetById: (id: number) => `superadmin/users-login-log/getById/${id}`,
    },

  },

  Ngo: {

    Accreditation: {
      AccreditSchool: 'ngo/accreditation/school',
      AccreditUniversity: 'ngo/accreditation/university',
      AccreditProgram: 'ngo/accreditation/program'
    },

    SponsorshipTypes: {
      Search: 'ngo/sponsorship-types/search',
      GetById: (id: number) => `ngo/sponsorship-types/getById/${id}`,
      Create: 'ngo/sponsorship-types/create',
      Update: (id: number) => `ngo/sponsorship-types/update/${id}`,
      Delete: (id: number) => `ngo/sponsorship-types/delete/${id}`
    },

    StudentCategories: {
      Search: 'ngo/student-categories/search',
      GetById: (id: number) => `ngo/student-categories/getById/${id}`,
      Create: 'ngo/student-categories/create',
      Update: (id: number) => `ngo/student-categories/update/${id}`,
      Delete: (id: number) => `ngo/student-categories/delete/${id}`
    },

    SponsorshipMatrix: {
      GetMatrix: 'ngo/sponsorship-matrix',
      Toggle: 'ngo/sponsorship-matrix/toggle'
    },

    PanelUsers: {
      Create: 'ngo/panel-users/create',
      Update: (staffId: number) => `ngo/panel-users/update/${staffId}`,
      Delete: (staffId: number) => `ngo/panel-users/delete/${staffId}`,
      GetById: (staffId: number) => `ngo/panel-users/getById/${staffId}`,
      Search: 'ngo/panel-users/search'
    },

    UniversityCoordinator: {
      Search: 'ngo/university-coordinators/search',
      GetById: (staffId: number) => `ngo/university-coordinators/getById/${staffId}`,
      Create: 'ngo/university-coordinators/create',
      Update: (staffId: number) => `ngo/university-coordinators/update/${staffId}`,
      Delete: (staffId: number) => `ngo/university-coordinators/delete/${staffId}`,
    },

    SchoolCoordinator: {
      Search: 'ngo/school-coordinators/search',
      GetById: (staffId: number) => `ngo/school-coordinators/getById/${staffId}`,
      Create: 'ngo/school-coordinators/create',
      Update: (staffId: number) => `ngo/school-coordinators/update/${staffId}`,
      Delete: (staffId: number) => `ngo/school-coordinators/delete/${staffId}`
    },


  },

  University: {

    Courses: {
      Search: 'university/courses/search',
      GetById: (id: number) => `university/courses/getById/${id}`,
      Create: 'university/courses/create',
      Update: (id: number) => `university/courses/update/${id}`,
      Delete: (id: number) => `university/courses/delete/${id}`
    },

    Faculties: {
      FacultyPrograms: `university/faculties/faculty-programs`,
      Search: 'university/faculties/search',
      GetById: (id: number) => `university/faculties/getById/${id}`,
      Create: 'university/faculties/create',
      Update: (id: number) => `university/faculties/update/${id}`,
      Delete: (id: number) => `university/faculties/delete/${id}`
    },

    Programs: {
      Search: 'university/programs/search',
      GetById: (id: number) => `university/programs/getById/${id}`,
      GetSemesterByProgramId: (id: number) => `university/programs/semesters/${id}`,
      Create: 'university/programs/create',
      Update: (id: number) => `university/programs/update/${id}`,
      Delete: (id: number) => `university/programs/delete/${id}`
    },

    ProgramRegistrationWindow: {
      GetByProgramId: (programId: number) => `program-registration-window/${programId}`,
      Save: 'program-registration-window'
    },

    DocumentTypes: {
      Search: 'university/document-types/search',
      GetById: (id: number) => `university/document-types/getById/${id}`,
      Create: 'university/document-types/create',
      Update: (id: number) => `university/document-types/update/${id}`,
      Delete: (id: number) => `university/document-types/delete/${id}`
    },

    MasterUniversity: {
      Search: 'university/master-university/search',
      GetById: (id: number) => `university/master-university/getById/${id}`,
      Create: 'university/master-university/create',
      Update: (id: number) => `university/master-university/update/${id}`,
      Delete: (id: number) => `university/master-university/delete/${id}`
    },

    AcademicRegistration: {
      AcademicRegistrationSearch: 'university/academic-registration/search',
      AcademicRegistrationRegister: 'university/academic-registration/register',
    },

  },

  School: {

    MasterSchool: {
      Search: 'school/master-school/search',
      GetById: (id: number) => `school/master-school/getById/${id}`,
      Create: 'school/master-school/create',
      Update: (id: number) => `school/master-school/update/${id}`,
      Delete: (id: number) => `school/master-school/delete/${id}`,
      GetSchoolsByCountryIds: 'school/master-school/getSchoolsByCountryIds',
    },

    Student: {
      Search: 'school/student/search',
      Create: 'school/student/create',
      GetById: (id: number) => `school/student/getById/${id}`,
      Update: (id: number) => `school/student/update/${id}`,
      Delete: (id: number) => `school/student/delete/${id}`,

      UploadProfilePhoto: (studentId: number) =>
        `school/student/upload-profile-photo/${studentId}`,

      DeleteProfilePhoto: (studentId: number) =>
        `school/student/delete-profile-photo/${studentId}`,

      UploadRecommendationLetter: (studentId: number) =>
        `school/student/upload-recommendation-letter/${studentId}`,

      DeleteRecommendationLetter: (studentId: number) =>
        `school/student/delete-recommendation-letter/${studentId}`,
    },

    StudentProgram: {
      CandidatePrograms: (studentId: number) => `school/student-program/candidate-programs/${studentId}`,
      Apply: (studentId: number) => `school/student-program/apply/${studentId}`,
      Cancel: (applicationId: number) => `school/student-program/cancel/${applicationId}`,
      Submit: (applicationId: number) => `school/student-program/submit/${applicationId}`,
      GetById: (applicationId: number) => `school/student-program/getById/${applicationId}`,

      UploadDocument: (applicationId: number) => `school/student-program/upload-document/${applicationId}`,
      DeleteDocument: (applicationId: number, documentId: number) => `school/student-program/delete-document/${applicationId}/${documentId}`,
      GetDocuments: (applicationId: number) => `school/student-program/documents/${applicationId}`,
      GetHistory: (studentId: number) => `school/student-program/history/${studentId}`,

      // University / Direct Aid Committee
      Search: `school/student-program/search`,
      GetApplication: (applicationId: number) => `school/student-program/${applicationId}`,
      ChangeStatus: (applicationId: number) => `school/student-program/change-status/${applicationId}`

    }

  }

} as const;