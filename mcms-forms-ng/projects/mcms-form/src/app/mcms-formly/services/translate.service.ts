import { Injectable } from '@angular/core';
import { IOpenApiDocument } from '../models/open-api-models';
import { FormlyConfig, FormlyFieldConfig } from '@ngx-formly/core';

@Injectable()
export class TranslateService {

  private docValue: IOpenApiDocument;

  public set doc(value: IOpenApiDocument) {
    this.docValue = value;
  }

  constructor(
    private formlyConfig: FormlyConfig,
  ) {
  }

  public getTranslationsDict(doc: IOpenApiDocument): { [key: string]: string } {
    const lang = this.getLang() || doc.translations.defaultLanguage;
    if (!doc || !doc.translations || !doc.translations.translations) {
      return {};
    }
    return doc.translations.translations[lang] || {};
  }

  public getLang(): string {
    return localStorage.getItem('ui-lang');
  }

  public registerValidationMessages(): void {
    const trans = this.getTranslationsDict(this.docValue);
    if (trans) {
      for (const key of Object.keys(trans)) {
        this.formlyConfig.addValidatorMessage(key, trans[key]);
      }
    }
  }

  public tryTranslate(msg: string): string {
    const trans = this.getTranslationsDict(this.docValue);
    return trans.hasOwnProperty(msg) ? trans[msg] : msg;
  }

  public translate(fieldConfig: FormlyFieldConfig): void {
    fieldConfig.templateOptions.label = this.tryTranslate(fieldConfig.templateOptions.label);
    fieldConfig.templateOptions.placeholder = this.tryTranslate(fieldConfig.templateOptions.placeholder);
    fieldConfig.templateOptions.description = this.tryTranslate(fieldConfig.templateOptions.description);
  }
}
