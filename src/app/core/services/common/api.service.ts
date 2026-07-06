import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);

  get<T>(endpoint: string) 
  {
    return this.http.get<T>(`${environment.apiUrl}${endpoint}`);
  }

  post<T>(endpoint: string, body: any) 
  {
    return this.http.post<T>(`${environment.apiUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any) 
  {
    return this.http.put<T>(`${environment.apiUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string) 
  { 
    return this.http.delete<T>(`${environment.apiUrl}${endpoint}`);
  }
  
}