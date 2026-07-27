import { StudentCategoryRequest } from "../student-category/student-category.request.model";
import { SponsorshipCategoryMapping } from "./sponsorship-category-mapping.model";
import { SponsorshipTypeRequest } from '../sponsorship-type/sponsorship-type-request.model';

export class SponsorshipMatrix {
  sponsorshipTypes: SponsorshipTypeRequest[] = [];
  studentCategories: StudentCategoryRequest[] = [];
  mappings: SponsorshipCategoryMapping[] = [];
}