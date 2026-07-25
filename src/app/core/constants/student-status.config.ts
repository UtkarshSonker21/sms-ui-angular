import { StudentStatusEnum } from "../enums/student-application-status.enum";

export interface StudentStatusConfig {
    id: StudentStatusEnum;
    name: string;
    badgeClass: string;
}

export const STUDENT_STATUS_CONFIG: StudentStatusConfig[] = [

    {
        id: StudentStatusEnum.Draft,
        name: 'Draft',
        badgeClass: 'chip-draft'
    },

    {
        id: StudentStatusEnum.AcceptanceInProcess,
        name: 'Acceptance In Process',
        badgeClass: 'chip-acceptance-process'
    },

    {
        id: StudentStatusEnum.Accepted,
        name: 'Accepted',
        badgeClass: 'chip-accepted'
    },

    {
        id: StudentStatusEnum.AcceptanceRejected,
        name: 'Acceptance Rejected',
        badgeClass: 'chip-acceptance-rejected'
    },

    {
        id: StudentStatusEnum.AwardingInProcess,
        name: 'Awarding In Process',
        badgeClass: 'chip-awarding-process'
    },

    {
        id: StudentStatusEnum.Awarded,
        name: 'Awarded',
        badgeClass: 'chip-awarded'
    },

    {
        id: StudentStatusEnum.AwardingRejected,
        name: 'Awarding Rejected',
        badgeClass: 'chip-awarding-rejected'
    },

    {
        id: StudentStatusEnum.SponsoringInProcess,
        name: 'Sponsoring In Process',
        badgeClass: 'chip-sponsoring-process'
    },

    {
        id: StudentStatusEnum.Sponsored,
        name: 'Sponsored',
        badgeClass: 'chip-sponsored'
    },

    {
        id: StudentStatusEnum.SponsoringRejected,
        name: 'Sponsoring Rejected',
        badgeClass: 'chip-sponsoring-rejected'
    },

    {
        id: StudentStatusEnum.Registered,
        name: 'Registered',
        badgeClass: 'chip-registered'
    },

    {
        id: StudentStatusEnum.Failed,
        name: 'Failed',
        badgeClass: 'chip-failed'
    },

    {
        id: StudentStatusEnum.Dismissed,
        name: 'Dismissed',
        badgeClass: 'chip-dismissed'
    },

    {
        id: StudentStatusEnum.Graduated,
        name: 'Graduated',
        badgeClass: 'chip-graduated'
    }
];


// Direct Aid Committee
export const COMMITTEE_STATUS_IDS = [

    // StudentStatusEnum.Draft,

    // Acceptance
    // StudentStatusEnum.AcceptanceInProcess,
    // StudentStatusEnum.Accepted,
    // StudentStatusEnum.AcceptanceRejected,

    // Awarding
    // StudentStatusEnum.AwardingInProcess,
    // StudentStatusEnum.Awarded,
    // StudentStatusEnum.AwardingRejected,

    // Sponsoring
    StudentStatusEnum.SponsoringInProcess,
    StudentStatusEnum.Sponsored,
    StudentStatusEnum.SponsoringRejected,

    // Student Lifecycle
    // StudentStatusEnum.Registered,
    // StudentStatusEnum.Failed,
    // StudentStatusEnum.Dismissed,
    // StudentStatusEnum.Graduated
];


// University
export const UNIVERSITY_STATUS_IDS = [

    // StudentStatusEnum.Draft,

    // Acceptance
    StudentStatusEnum.AcceptanceInProcess,
    StudentStatusEnum.Accepted,
    StudentStatusEnum.AcceptanceRejected,

    // Awarding
    StudentStatusEnum.AwardingInProcess,
    StudentStatusEnum.Awarded,
    StudentStatusEnum.AwardingRejected,

    // Sponsoring
    // StudentStatusEnum.SponsoringInProcess,
    // StudentStatusEnum.Sponsored,
    // StudentStatusEnum.SponsoringRejected,

    // Student Lifecycle
    StudentStatusEnum.Registered,
    // StudentStatusEnum.Failed,
    // StudentStatusEnum.Dismissed,
    StudentStatusEnum.Graduated
];


// School
export const SCHOOL_STATUS_IDS = [

    StudentStatusEnum.Draft,

    // Acceptance
    StudentStatusEnum.AcceptanceInProcess,
    StudentStatusEnum.Accepted,
    StudentStatusEnum.AcceptanceRejected,

    // Awarding
    // StudentStatusEnum.AwardingInProcess,
    StudentStatusEnum.Awarded,
    StudentStatusEnum.AwardingRejected,

    // Sponsoring
    StudentStatusEnum.Sponsored,
    StudentStatusEnum.SponsoringInProcess,
    StudentStatusEnum.SponsoringRejected,

    // Student Lifecycle
    StudentStatusEnum.Registered,
    // StudentStatusEnum.Failed,
    // StudentStatusEnum.Dismissed,
    StudentStatusEnum.Graduated
];


// Marketing
export const MARKETING_STATUS_IDS = [

    // StudentStatusEnum.Draft,

    // Acceptance
    // StudentStatusEnum.AcceptanceInProcess,
    StudentStatusEnum.Accepted,
    // StudentStatusEnum.AcceptanceRejected,

    // Awarding
    // StudentStatusEnum.AwardingInProcess,
    StudentStatusEnum.Awarded,
    // StudentStatusEnum.AwardingRejected,

    // Sponsoring
    StudentStatusEnum.Sponsored,
    // StudentStatusEnum.SponsoringInProcess,
    // StudentStatusEnum.SponsoringRejected,

    // Student Lifecycle
    StudentStatusEnum.Registered,
    // StudentStatusEnum.Failed,
    // StudentStatusEnum.Dismissed,
    StudentStatusEnum.Graduated
];


// Finance
export const FINANCE_STATUS_IDS = [

    // StudentStatusEnum.Draft,

    // Acceptance
    // StudentStatusEnum.AcceptanceInProcess,
    // StudentStatusEnum.Accepted,
    // StudentStatusEnum.AcceptanceRejected,

    // Awarding
    // StudentStatusEnum.AwardingInProcess,
    // StudentStatusEnum.Awarded,
    // StudentStatusEnum.AwardingRejected,

    // Sponsoring
    StudentStatusEnum.Sponsored,
    // StudentStatusEnum.SponsoringInProcess,
    // StudentStatusEnum.SponsoringRejected,

    // Student Lifecycle
    StudentStatusEnum.Registered,
    // StudentStatusEnum.Failed,
    // StudentStatusEnum.Dismissed,
    StudentStatusEnum.Graduated
];


// Donor
export const DONOR_STATUS_IDS = [

    // StudentStatusEnum.Draft,

    // Acceptance
    // StudentStatusEnum.AcceptanceInProcess,
    // StudentStatusEnum.Accepted,
    // StudentStatusEnum.AcceptanceRejected,

    // Awarding
    // StudentStatusEnum.AwardingInProcess,
    // StudentStatusEnum.Awarded,
    // StudentStatusEnum.AwardingRejected,

    // Sponsoring
    StudentStatusEnum.Sponsored,
    // StudentStatusEnum.SponsoringInProcess,
    // StudentStatusEnum.SponsoringRejected,

    // Student Lifecycle
    StudentStatusEnum.Registered,
    // StudentStatusEnum.Failed,
    // StudentStatusEnum.Dismissed,
    StudentStatusEnum.Graduated
];

