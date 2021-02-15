import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, publishReplay, refCount, take, tap } from 'rxjs/operators';
import * as areEqual from 'fast-deep-equal';

@Injectable()
export class FormlyHelpersApiService {

  constructor(
    private http: HttpClient,
  ) {
  }

  private obsCache: { [key: string]: Observable<any> } = {};
  private subjects: { [key: string]: Subject<any> } = {};
  private cacheDuration = 5000;

  public get<T>(url: string): Observable<T> {
    return this.http.get<T>(url);
  }

  public clearRefsArtifacts(obj): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    if (Array.isArray(obj)) {
      for (const p of obj) {
        this.clearRefsArtifacts(p);
      }
    } else {
      for (const objKey in obj) {
        if (obj.hasOwnProperty(objKey)) {
          if ((objKey === '$ref' || objKey === '$id') && typeof obj[objKey] === 'string') {
            delete obj[objKey];
          }
          this.clearRefsArtifacts(obj[objKey]);
        }
      }
    }
  }

  public getCaching<T>(url: string, noCache?: boolean): Observable<T> {
    if (!this.subjects[url]) {
      this.subjects[url] = new Subject<T>();
    }
    // merge the request observable with the Subject, which will be triggered (*) when a new value will be fetch from backend in the future
    return merge(this.makeGetObservable(url, noCache), this.subjects[url])
      // pipe a distinctUntilChanged operator to avoid duplicate values on first request
      .pipe(distinctUntilChanged((a, b) => {
        return areEqual(a, b);
      }));
  }

  public clearCacheAndTriggerRequest(url: string): void {
    this.getCaching(url, true).pipe(take(1)).toPromise().then();
  }

  private makeGetObservable(url: string, noCache?: boolean): Observable<any> {
    if (noCache && this.obsCache[url]) {
      delete this.obsCache[url];
    }
    if (!this.obsCache[url]) {
      this.obsCache[url] = this.http.get(url).pipe(
        tap(value => {
          this.clearRefsArtifacts(value);
        }),
        tap(value => this.subjects[url]?.next(value)), // emit the new value got from backend to all subscriptions (*)
        publishReplay(1, this.cacheDuration), // this tells Rx to cache the latest emitted
        refCount(), // and this tells Rx to keep the Observable alive as long as there are any Subscribers
        take(1), // complete after the first (count=1) value emitted
      );
    }
    return this.obsCache[url];
  }

}
