import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConnectableObservable, Observable } from 'rxjs';
import { publishReplay, tap } from 'rxjs/operators';
import { IOpenApiDocument } from '../models/open-api-models';
import { TranslateService } from './translate.service';

@Injectable()
export class OpenApiConfigService {

  constructor(
    private http: HttpClient,
    private trans: TranslateService,
  ) {
  }

  private endpointUrl: string;

  private observable: Observable<IOpenApiDocument>;


  public getConfig(): Observable<IOpenApiDocument> {
    if (!this.observable) {
      this.buildObservable();
    }
    return this.observable;
  }

  private buildObservable(): void {
    const requestOptions = {headers: {'X-LANG': this.trans.getLang() || ''}};
    const obs: ConnectableObservable<IOpenApiDocument> =
      this.http.get<IOpenApiDocument>(this.endpointUrl, requestOptions).pipe(tap(doc => {
        this.trans.doc = doc;
        this.trans.registerValidationMessages();
      })).pipe(publishReplay()) as ConnectableObservable<IOpenApiDocument>;
    obs.connect();
    this.observable = obs;
  }


  public clearCache(): void {
    this.observable = null;
  }

  public setEndpointUrl(value: string): void {
    if (!value) {
      console.error('setEndpointUrl with empty/null param, keeping old value');
      return;
    }
    this.endpointUrl = value;
  }
}
