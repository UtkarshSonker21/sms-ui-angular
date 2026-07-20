import { Injectable, inject } from '@angular/core';

import { ApiService } from '../common/api.service';
import { ApiEndpoints } from '../../../core/constants/api-endpoints';

import { ApiResponse } from '../../models/common/response/api-response.model';

import {
  ApplyRequest,
  CandidateProgram,
  StudentHistory,
  StudentProgramApplication,
  StudentProgramDocument,
  UploadDocumentRequest
} from '../../models/school/students/student-program-application.model';


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




}