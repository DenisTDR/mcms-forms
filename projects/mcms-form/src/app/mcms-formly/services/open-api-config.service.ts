import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConnectableObservable, Observable } from 'rxjs';
import { publishReplay, tap } from 'rxjs/operators';
import { IOpenApiDocument } from '../models/open-api-models';
import { FormlyConfig } from '@ngx-formly/core';

@Injectable()
export class OpenApiConfigService {

  constructor(
    private http: HttpClient,
    private formlyConfig: FormlyConfig,
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
    const requestOptions = {headers: {'X-LANG': this.getLang() || ''}};
    const obs: ConnectableObservable<IOpenApiDocument> =
      this.http.get<IOpenApiDocument>(this.endpointUrl, requestOptions).pipe(tap(doc => {
        this.registerValidationMessages(doc);
      })).pipe(publishReplay()) as ConnectableObservable<IOpenApiDocument>;
    obs.connect();
    this.observable = obs;
  }

  private registerValidationMessages(doc: IOpenApiDocument): void {
    const trans = this.getTranslationsDict(doc);
    if (trans) {
      for (const key of Object.keys(trans)) {
        this.formlyConfig.addValidatorMessage(key, trans[key]);
      }
    }
  }

  public getTranslationsDict(doc: IOpenApiDocument): { [key: string]: string } {
    const lang = this.getLang() || doc.translations.defaultLanguage;
    if (!doc || !doc.translations || !doc.translations.translations) {
      return {};
    }
    return doc.translations.translations[lang] || {};
  }

  private getLang(): string {
    return localStorage.getItem('ui-lang');
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
