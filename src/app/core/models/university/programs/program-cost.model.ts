export class ProgramCost {
  programCostId?: number;

  sponsorshipTypeId: number = 0;

  sponsorshipTypeName?: string;

  // 1 = One Time
  // 2 = Semester
  frequencyTypeId?: number;

  amount: number = 0;
}