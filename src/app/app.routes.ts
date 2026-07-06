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
            }

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

            


            // LAST CHILD
            {
                path: '**',
                component: PageNotFound
            }

        ]
    },


];
