import { Injectable } from '@angular/core';
import { IOpenApiDocument } from '../models/open-api-models';
import { FormlyConfig, FormlyFieldConfig } from '@ngx-formly/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable()
export class TranslateService {

  private docValue: IOpenApiDocument;
  private translationsDict: { [key: string]: string };

  public set doc(value: IOpenApiDocument) {
    this.docValue = value;
  }

  constructor(
    private formlyConfig: FormlyConfig,
    private sanitizer: DomSanitizer,
  ) {
  }

  public getTranslationsDict(doc: IOpenApiDocument): { [key: string]: string } {
    if (!this.translationsDict) {
      const lang = this.getLang() || doc.translations.defaultLanguage;
      if (!doc || !doc.translations || !doc.translations.translations) {
        return {};
      }
      this.translationsDict = doc.translations.translations[lang] || {};
    }
    return this.translationsDict;
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
    if (trans.hasOwnProperty(msg)) {
      const value = trans[msg];
      return value;
    } else {
      return msg;
    }
  }

  public tryTranslateAndBypassSecurity(msg: string): string | SafeHtml {
    const trans = this.getTranslationsDict(this.docValue);
    if (trans.hasOwnProperty(msg)) {
      const value = trans[msg];
      return this.sanitizer.bypassSecurityTrustHtml(value);
    } else {
      return msg;
    }
  }

  public translate(fieldConfig: FormlyFieldConfig): void {
    fieldConfig.templateOptions.label = this.tryTranslateAndBypassSecurity(fieldConfig.templateOptions.label) as string;
    fieldConfig.templateOptions.placeholder = this.tryTranslateAndBypassSecurity(fieldConfig.templateOptions.placeholder) as string;
    fieldConfig.templateOptions.description = this.tryTranslateAndBypassSecurity(fieldConfig.templateOptions.description) as string;
  }
}
