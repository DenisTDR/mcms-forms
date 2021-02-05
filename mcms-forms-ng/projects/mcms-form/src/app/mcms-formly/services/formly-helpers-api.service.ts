import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { publishReplay, refCount, take } from 'rxjs/operators';

@Injectable()
export class FormlyHelpersApiService {

  private cache: { [key: string]: Observable<any> } = {};

  constructor(
    private http: HttpClient,
  ) {
  }

  public get<T>(url: string): Observable<T> {
    return this.http.get<T>(url);
  }

  public getCaching<T>(url: string, windowTime?: number, clearCache?: boolean): Observable<T> {
    if (clearCache) {
      this.clearCache(url);
    }
    if (!this.cache[url]) {
      this.cache[url] = this.get<T>(url).pipe(
        publishReplay(1, windowTime || 5000), // this tells Rx to cache the latest emitted
        refCount(), // and this tells Rx to keep the Observable alive as long as there are any Subscribers
        take(1),
      );
    }
    return this.cache[url];
  }

  public clearCache(url?: string): void {
    if (url) {
      delete this.cache[url];
      return;
    }
    this.cache = {};
  }
}
