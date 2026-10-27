export interface UniversityOption {
  universityId: number;
  universityName: string;
}

export enum AcademicPeriodType {
  Fall = 1,
  Spring = 2,
  Summer = 3,
  Winter = 4,
  SpringSummer = 5,
  FallWinter = 6
}

export interface UniversityRegistrationWindow {
  universityRegistrationWindowId: number;
  universityId: number;
  universityName: string;
  periodType: number;
  academicYearStart: number;
  periodLabel: string;
  registrationFrom?: string | null;
  registrationTo: string;
  isOpen: boolean;
  isCurrentlyOpen: boolean;
  notes?: string | null;
  rowVersion: string;
}

export interface UniversityRegistrationWindowsResponse {
  universities: UniversityOption[];
  windows: UniversityRegistrationWindow[];
}

export interface OpenUniversityRegistrationWindowRequest {
  universityId: number;
  periodType: number;
  academicYearStart: number;
  registrationFrom: string;
  registrationTo: string;
  notes?: string;
  rowVersion?: string;
}

export interface CloseUniversityRegistrationWindowRequest {
  rowVersion: string;
}
