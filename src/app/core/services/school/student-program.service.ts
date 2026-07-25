import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';

import { ApiResponse } from '../../models/common/response/api-response.model';
import { CandidateProgram } from '../../models/school/student-program-application/candidate-program.model';
import { ApplyRequest } from '../../models/school/student-program-application/apply-request.model';
import { StudentHistory } from '../../models/school/student-program-application/student-history.model';
import { StudentProgramApplication } from '../../models/school/student-program-application/student-program-application.model';
import { StudentProgramDocument } from '../../models/school/student-program-application/student-program-document.model';
import { UploadDocumentRequest } from '../../models/school/student-program-application/upload-document-request.model';
import { PagedResult } from '../../models/common/response/paged-result.model';
import { StudentProgramApplicationFilter } from '../../models/school/student-program-application/student-program-application-filter.model';
import { ChangeStudentProgramStatus } from '../../models/school/student-program-application/change-student-program-status.model';


@Injectable({
  providedIn: 'root'
})
export class StudentProgramService {

  private readonly api = inject(ApiService);

  getCandidatePrograms(studentId: number) {
    return this.api.get<ApiResponse<CandidateProgram[]>>(
      ApiEndpoints.School.StudentProgram.CandidatePrograms(studentId)
    );
  }

  apply(studentId: number, model: ApplyRequest) {
    return this.api.post<ApiResponse<number>>(
      ApiEndpoints.School.StudentProgram.Apply(studentId),
      model
    );
  }

  cancelApplication(applicationId: number) {
    return this.api.delete<ApiResponse<void>>(
      ApiEndpoints.School.StudentProgram.Cancel(applicationId)
    );
  }

  submitApplication(applicationId: number) {
    return this.api.post<ApiResponse<void>>(
      ApiEndpoints.School.StudentProgram.Submit(applicationId),
      {}
    );
  }

  getApplicationById(applicationId: number) {
    return this.api.get<ApiResponse<StudentProgramApplication>>(
      ApiEndpoints.School.StudentProgram.GetById(applicationId)
    );
  }

  uploadDocument(applicationId: number, model: UploadDocumentRequest) {
    const formData = new FormData();

    formData.append('programDocumentId', model.programDocumentId.toString());
    formData.append('documentTypeId', model.documentTypeId.toString());

    if (model.file) {
      formData.append('file', model.file);
    }

    return this.api.post<ApiResponse<StudentProgramDocument>>(
      ApiEndpoints.School.StudentProgram.UploadDocument(applicationId),
      formData
    );
  }

  deleteDocument(applicationId: number, documentId: number) {
    return this.api.delete<ApiResponse<void>>(
      ApiEndpoints.School.StudentProgram.DeleteDocument(applicationId, documentId)
    );
  }

  getDocuments(applicationId: number) {
    return this.api.get<ApiResponse<StudentProgramDocument[]>>(
      ApiEndpoints.School.StudentProgram.GetDocuments(applicationId)
    );
  }

  getHistory(studentId: number) {
    return this.api.get<ApiResponse<StudentHistory[]>>(
      ApiEndpoints.School.StudentProgram.GetHistory(studentId)
    );
  }


  // Search student program applications (University / Committee)
search(model: StudentProgramApplicationFilter) {
  return this.api.post<ApiResponse<PagedResult<StudentProgramApplication>>>(
    ApiEndpoints.School.StudentProgram.Search,
    model
  );
}

// Get application details for review (University / Committee)
getById(applicationId: number) {
  return this.api.get<ApiResponse<StudentProgramApplication>>(
    ApiEndpoints.School.StudentProgram.GetApplication(applicationId)
  );
}

// Change application status (University / Committee)
changeStatus(applicationId: number, model: ChangeStudentProgramStatus) {
  return this.api.put<ApiResponse<void>>(
    ApiEndpoints.School.StudentProgram.ChangeStatus(applicationId),
    model
  );
}




}