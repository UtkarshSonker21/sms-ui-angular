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
                path: 'school-dashboard',
                component: SchoolDashboard
            },
            {
                path: 'marketing-dashboard',
                component: MarketingDashboard
            },


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

            // {
            //     path: 'coordinator-students',
            //     component: Students
            // },
            {
                path: 'coordinator-students',
                component: CoordinatorStudentsList
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
