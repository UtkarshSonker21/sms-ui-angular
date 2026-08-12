import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';

import { Login } from './features/auth/login/login';
import { ForgotUsername } from './features/auth/forgot-username/forgot-username';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { ResetPassword } from './features/auth/reset-password/reset-password';
import { LoginWithCode } from './features/auth/login-with-code/login-with-code';


import { PageNotFound } from './shared/components/page-not-found/page-not-found';
import { Dashboard } from './features/common/dashboard/dashboard';
import { UniversityDashboard } from './features/common/university-dashboard/university-dashboard';
import { NgoDashboard } from './features/common/ngo-dashboard/ngo-dashboard';
import { SchoolDashboard } from './features/common/school-dashboard/school-dashboard';
import { MarketingDashboard } from './features/common/marketing-dashboard/marketing-dashboard';
import { Courses } from './features/university/courses/courses';
import { Faculties } from './features/university/faculties/faculties';
import { Program } from './features/university/program/program';
import { ProgramDetail } from './features/university/program-detail/program-detail';
import { SchoolRegistration } from './features/school/school-registration/school-registration';
import { UniversityRegistration } from './features/university/university-registration/university-registration';
import { ProgramAccreditation } from './features/ngo/program-accreditation/program-accreditation';
import { ProgramAccreditationDetail } from './features/ngo/program-accreditation-detail/program-accreditation-detail';
import { UniversityAccreditation } from './features/ngo/university-accreditation/university-accreditation';
import { UniversityAccreditationDetail } from './features/ngo/university-accreditation-detail/university-accreditation-detail';
import { SchoolAccreditation } from './features/ngo/school-accreditation/school-accreditation';
import { SchoolAccreditationDetail } from './features/ngo/school-accreditation-detail/school-accreditation-detail';
import { Students } from './features/school/students/students';
import { CoordinatorStudentsList } from './features/school/coordinator-students-list/coordinator-students-list';
import { CoordinatorSchoolList } from './features/school/coordinator-school-list/coordinator-school-list';
import { CoordinatorNominations } from './features/school/coordinator-nominations/coordinator-nominations';
import { UniversityStudents } from './features/university/university-students/university-students';
import { UniversityStudentDetail } from './features/university/university-student-detail/university-student-detail';
import { NgoStudents } from './features/ngo/ngo-students/ngo-students';
import { NgoStudentDetail } from './features/ngo/ngo-student-detail/ngo-student-detail';
import { PreferencesCountries } from './features/ngo/preferences-countries/preferences-countries';
import { HighSchoolSpecializations } from './features/ngo/high-school-specializations/high-school-specializations';
import { PreferencesSponsorshipMatrix } from './features/ngo/preferences-sponsorship-matrix/preferences-sponsorship-matrix';
import { MarketingAdministrativeFee } from './features/ngo/marketing-administrative-fee/marketing-administrative-fee';
import { AcademicRegistration } from './features/university/academic-registration/academic-registration';
import { FailingCoreCases } from './features/ngo/failing-core-cases/failing-core-cases';
import { PanelUsers } from './features/ngo/panel-users/panel-users';
import { UniversityCoordinators } from './features/ngo/university-coordinators/university-coordinators';
import { SchoolCoordinators } from './features/ngo/school-coordinators/school-coordinators';
import { Staff } from './features/superadmin/staff/staff';
import { Menus } from './features/superadmin/menus/menus';
import { UsersRole } from './features/superadmin/users-role/users-role';
import { UsersRoleAssignment } from './features/superadmin/users-role-assignment/users-role-assignment';
import { UsersRolePermission } from './features/superadmin/users-role-permission/users-role-permission';
import { GeneralSetting } from './features/superadmin/general-setting/general-setting';
import { MasterCountry } from './features/superadmin/master-country/master-country';
import { MasterCurrency } from './features/superadmin/master-currency/master-currency';
import { MasterDropdown } from './features/superadmin/master-dropdown/master-dropdown';
import { MasterDropdownValues } from './features/superadmin/master-dropdown-values/master-dropdown-values';

export const routes: Routes = [

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },

    // Authentication
    {
        path: '',
        component: AuthLayout,
        children: [

            {
                path: 'login',
                component: Login
            },

            {
                path: 'forgot-username',
                component: ForgotUsername
            },

            {
                path: 'forgot-password',
                component: ForgotPassword
            },

            {
                path: 'reset-password',
                component: ResetPassword
            },

            {
                path: 'login-with-code',
                component: LoginWithCode
            },

            {
                path: 'school-registration',
                component: SchoolRegistration
            },

            {
                path: 'university-registration',
                component: UniversityRegistration
            },

        ]
    },

    // Main Application
    {
        path: '',
        component: MainLayout,
        canActivateChild: [authGuard],
        children: [

            {
                path: 'dashboard',
                component: Dashboard
            },
            {
                path: 'super-admin-dashboard',
                component: Dashboard
            },
            {
                path: 'ngo-dashboard',
                component: NgoDashboard
            },
            {
                path: 'university-dashboard',
                component: UniversityDashboard
            },
            {
                path: 'coordinator-dashboard',
                component: SchoolDashboard
            },
            {
                path: 'marketing-dashboard',
                component: MarketingDashboard
            },

            // superadmin components
            {
                path: 'staff',
                component: Staff
            },
            {
                path: 'menus',
                component: Menus
            },
            {
                path: 'users-role',
                component: UsersRole
            },
            {
                path: 'users-role-assignments',
                component: UsersRoleAssignment
            },
            {
                path: 'users-role-permissions',
                component: UsersRolePermission
            },
            {
                path: 'general-settings',
                component: GeneralSetting
            },
            {
                path: 'countries',
                component: MasterCountry
            },
            {
                path: 'currencies',
                component: MasterCurrency
            },
            {
                path: 'dropdown-lists',
                component: MasterDropdown
            },
            {
                path: 'dropdown-lists/value/:id/:dropdownName',
                component: MasterDropdownValues
            },

            

            // ngo components
            {
                path: 'program-accreditation',
                component: ProgramAccreditation
            },
            {
                path: 'program-accreditation-detail/:programId',
                component: ProgramAccreditationDetail
            },
            {
                path: 'university-accreditation',
                component: UniversityAccreditation
            },
            {
                path: 'university-accreditation-detail/:registrationId',
                component: UniversityAccreditationDetail
            },
            {
                path: 'school-accreditation',
                component: SchoolAccreditation
            },
            {
                path: 'school-accreditation-detail/:schoolId',
                component: SchoolAccreditationDetail
            },
            {
                path: 'failing-core-cases',
                component: FailingCoreCases
            },
            {
                path: 'ngo-students',
                component: NgoStudents
            },
            {
                path: 'ngo-student-details/:id',
                component: NgoStudentDetail
            },
            {
                path: 'panel-users',
                component: PanelUsers
            },
            {
                path: 'university-coordinators',
                component: UniversityCoordinators
            },
            {
                path: 'school-coordinators',
                component: SchoolCoordinators
            },
            {
                path: 'preferences-countries',
                component: PreferencesCountries
            },
            {
                path: 'high-school-specializations',
                component: HighSchoolSpecializations
            },
            {
                path: 'preferences-sponsorship-matrix',
                component: PreferencesSponsorshipMatrix
            },
            {
                path: 'preferences-marketing-admin-fee',
                component: MarketingAdministrativeFee
            },



            // university components
            {
                path: 'course-list',
                component: Courses
            },
            {
                path: 'faculties',
                component: Faculties
            },
            {
                path: 'programs',
                component: Program
            },
            {
                path: 'programs/:programId',
                component: Program
            },
            {
                path: 'programs-detail/:programId',
                component: ProgramDetail
            },
            {
                path: 'university-students',
                component: UniversityStudents
            },
            {
                path: 'university-student-details/:id',
                component: UniversityStudentDetail
            },
            {
                path: 'academic-registration',
                component: AcademicRegistration
            },





            // school coordinator  components
            {
                path: 'coordinator-schools',
                component: CoordinatorSchoolList
            },
            {
                path: 'coordinator-school-registration',
                component: SchoolRegistration
            },
            {
                path: 'coordinator-school-registration/:schoolId',
                component: SchoolRegistration
            },
            {
                path: 'coordinator-students',
                component: CoordinatorStudentsList
            },
            {
                path: 'coordinator-nominations',
                component: CoordinatorNominations
            },
            {
                path: 'add-student',
                component: Students
            },
            {
                path: 'edit-student/:studentId',
                component: Students
            },




            // LAST CHILD
            {
                path: '**',
                component: PageNotFound
            }

        ]
    },


];
