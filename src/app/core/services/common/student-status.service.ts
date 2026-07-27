import { Injectable } from '@angular/core';

import {
    STUDENT_STATUS_CONFIG,
    UNIVERSITY_STATUS_IDS,
    SCHOOL_STATUS_IDS,
    COMMITTEE_STATUS_IDS,
    MARKETING_STATUS_IDS,
    FINANCE_STATUS_IDS,
    DONOR_STATUS_IDS
} from '../../constants/student-status.config';

import { StudentStatusEnum } from '../../enums/student-application-status.enum';
import { StudentRequest } from '../../models/school/students/student-request.model';
import { StudentProgramApplication } from '../../models/school/student-program-application/student-program-application.model';

@Injectable({
    providedIn: 'root'
})
export class StudentStatusService {

    getAll() {
        return STUDENT_STATUS_CONFIG;
    }

    getStatus(statusId: StudentStatusEnum) {
        return STUDENT_STATUS_CONFIG.find(x => x.id === statusId);
    }

    getName(statusId: StudentStatusEnum): string {
        return this.getStatus(statusId)?.name ?? 'Unknown';
    }

    getBadgeClass(statusId: StudentStatusEnum): string {
        return this.getStatus(statusId)?.badgeClass ?? 'chip-draft';
    }

    getStatuses(statusIds: StudentStatusEnum[]) {

        return STUDENT_STATUS_CONFIG.filter(x =>
            statusIds.includes(x.id)
        );
    }

    getStatusOptions(statusIds: StudentStatusEnum[]) {
        return this.getStatuses(statusIds);
    }

    count(items: StudentRequest[], status: StudentStatusEnum): number {
        return items.filter(x =>
            x.studentApplicationStatusId === status
        ).length;
    }

    counts(items: StudentProgramApplication[], status: StudentStatusEnum): number {
        return items.filter(x =>
            x.applicationStatusId === status
        ).length;
    }

    // =========================
    // Module Statuses
    // =========================

    getUniversityStatuses() {
        return this.getStatuses(UNIVERSITY_STATUS_IDS);
    }

    getSchoolStatuses() {
        return this.getStatuses(SCHOOL_STATUS_IDS);
    }

    getCommitteeStatuses() {
        return this.getStatuses(COMMITTEE_STATUS_IDS);
    }

    getMarketingStatuses() {
        return this.getStatuses(MARKETING_STATUS_IDS);
    }

    getFinanceStatuses() {
        return this.getStatuses(FINANCE_STATUS_IDS);
    }

    getDonorStatuses() {
        return this.getStatuses(DONOR_STATUS_IDS);
    }

}