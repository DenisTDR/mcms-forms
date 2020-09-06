import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

@Injectable()
export class ApiService {
  public getUrl: string;
  public submitUrl: string;

  constructor(private http: HttpClient) {
  }

  public async get<T>(): Promise<T> {
    if (!this.getUrl) {
      return {} as T;
    }
    return await this.http.get<T>(this.getUrl).toPromise();
  }

  public async create<T>(data: any): Promise<HttpResponse<T>> {
    return await this.http.post<T>(this.submitUrl, data, {observe: 'response'}).toPromise();
  }

  public async patch<T>(data: any): Promise<HttpResponse<T>> {
    return await this.http.patch<T>(this.submitUrl, data, {observe: 'response'}).toPromise();
  }
}
