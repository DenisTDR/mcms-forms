import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { FormlyHelpersApiService } from '../mcms-formly/services/formly-helpers-api.service';

@Injectable()
export class ApiService {
  public getUrl: string;
  public submitUrl: string;

  constructor(
    private http: HttpClient,
    private apiHelper: FormlyHelpersApiService) {
  }

  public async get<T>(): Promise<T> {
    if (!this.getUrl) {
      return {} as T;
    }
    const result = await this.http.get<T>(this.getUrl).toPromise();
    this.apiHelper.clearRefsArtifacts(result);
    return result;
  }

  public async create<T>(data: any): Promise<HttpResponse<T>> {
    const result = await this.http.post<T>(this.submitUrl, data, {observe: 'response'}).toPromise();
    this.apiHelper.clearRefsArtifacts(result);
    return result;
  }

  public async patch<T>(data: any): Promise<HttpResponse<T>> {
    const result = await this.http.patch<T>(this.submitUrl, data, {observe: 'response'}).toPromise();
    this.apiHelper.clearRefsArtifacts(result);
    return result;
  }
}
