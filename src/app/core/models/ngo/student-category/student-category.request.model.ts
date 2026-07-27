export class StudentCategoryRequest {
  studentCategoryId?: number;
  categoryName: string = '';
  displayOrder: number = 0;
  isActive: boolean = true;

  // Response Only
  createdDate?: Date;
  createdBy?: number;
  createdByName?: string;

  updatedDate?: Date;
  updatedBy?: number;
  updatedByName?: string;
}