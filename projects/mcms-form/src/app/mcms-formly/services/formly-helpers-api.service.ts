import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class FormlyHelpersApiService {

  constructor(private http: HttpClient) {
  }

  public get<T>(url: string): Observable<T> {
    return this.http.get<T>(url);
  }
}
