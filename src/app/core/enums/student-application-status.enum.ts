export enum StudentStatusEnum {

    Draft = 0,

    // University - Document & Admission Review
    AcceptanceInProcess = 1,
    Accepted = 2,
    AcceptanceRejected = 3,

    // University - Final Award Approval
    AwardingInProcess = 4,
    Awarded = 5,
    AwardingRejected = 6,

    // Direct Aid Committee - Scholarship Funding
    SponsoringInProcess = 7,
    Sponsored = 8,
    SponsoringRejected = 9,

    // University - Student Lifecycle
    Registered = 10,
    Failed = 11,
    Dismissed = 12,
    Graduated = 13
  
}