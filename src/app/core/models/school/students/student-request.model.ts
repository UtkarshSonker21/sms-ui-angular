export class StudentRequest {

     // ─────────────────────────────────────────────────────────────
    // Identity
    // ─────────────────────────────────────────────────────────────

    studentId?: number;

    // ─────────────────────────────────────────────────────────────
    // Personal Information
    // ─────────────────────────────────────────────────────────────

    photoPath?: string;

    firstName: string = '';

    secondName?: string;

    thirdName?: string;

    lastName: string = '';

    motherName?: string;

    dob?: Date;

    nationalityId?: number;

    residenceCountryId?: number;

    tribe?: string;

    religionId?: number;

    genderId?: number;

    isOrphan?: boolean;

    orphanNumber?: string;

    // ─────────────────────────────────────────────────────────────
    // Address
    // ─────────────────────────────────────────────────────────────

    city?: string;

    village?: string;

    block?: string;

    street?: string;

    house?: string;

    phone?: string;

    email?: string;

    // ─────────────────────────────────────────────────────────────
    // Academic Information
    // ─────────────────────────────────────────────────────────────

    fromDaSchool: boolean = false;

    daStudentCode?: string;

    schoolId!: number;

    hsSpecialization?: string;

    tanzanianStudentCombination?: string;

    totalScore?: number;

    maxScore?: number;

    relativeGrade?: number;

    englishScore?: number;

    // ─────────────────────────────────────────────────────────────
    // Transfer Student
    // ─────────────────────────────────────────────────────────────

    transferInstitution?: string;

    transferProgram?: string;

    transferInstitutionType?: string;

    transferCredits?: number;

    transferLastSemEnd?: Date;

    transferGpa?: number;

    // ─────────────────────────────────────────────────────────────
    // Behaviour & Social Evaluation
    // ─────────────────────────────────────────────────────────────

    financialNeedStatusId?: number;

    selfRelianceLevelId?: number;

    motivationLevelId?: number;

    futureGoalsLevelId?: number;

    recommendationLetterPath?: string;

    recommendationLetterNotes?: string;

    recommendationLetterFile?: File;

    // ─────────────────────────────────────────────────────────────
    // Audit
    // ─────────────────────────────────────────────────────────────

    isDraft?: boolean;

    isActive: boolean = true;

    createdBy?: number;

    createdDate?: Date;

    updatedBy?: number;

    updatedDate?: Date;

    // ─────────────────────────────────────────────────────────────
    // Response Only
    // ─────────────────────────────────────────────────────────────

    fullName?: string;

    schoolName?: string;

    nationalityName?: string;

    residenceCountryName?: string;

    religionName?: string;

    genderName?: string;

    financialNeedStatusName?: string;

    selfRelianceLevelName?: string;

    motivationLevelName?: string;

    futureGoalsLevelName?: string;

    formattedCreatedBy?: string;

    formattedCreatedDate?: string;

    formattedUpdatedBy?: string;

    formattedUpdatedDate?: string;

}

