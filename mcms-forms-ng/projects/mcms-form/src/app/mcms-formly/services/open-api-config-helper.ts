import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyHelpersApiService } from './formly-helpers-api.service';
import clone from 'clone';
import * as deepmerge from 'deepmerge';
import { take, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as areEqual from 'fast-deep-equal';

export default class OpenApiConfigHelper {

  public basePath: string;

  constructor(
    private formlyHelpersApi: FormlyHelpersApiService,
  ) {
  }

  public async patchCustomOptionsConfig(fieldConfig: FormlyFieldConfig): Promise<void> {
    if (!fieldConfig?.templateOptions?.customFieldConfig?.loadOptionsFromUrl) {
      return;
    }
    const customFieldConfig = fieldConfig.templateOptions.customFieldConfig;

    if (customFieldConfig.optionsUrl && !customFieldConfig.globalVolatileUrl) {
      await this.loadOptions(fieldConfig);
    }

    if (customFieldConfig.optionsUrl) {
      fieldConfig.templateOptions.valueProp = o => o;
      fieldConfig.templateOptions.labelProp = customFieldConfig.labelProp;
      if (customFieldConfig.valueProp) {
        fieldConfig.templateOptions.compareWith = (o1, o2) => o1 === o2 ||
          (o1 && o2 && o1[customFieldConfig.valueProp] === o2[customFieldConfig.valueProp]);
      }
    }
  }

  public loadOptions(fieldConfig: FormlyFieldConfig, noCache?: boolean): Promise<any[]> {
    let url: string;

    if (fieldConfig.templateOptions.customFieldConfig.globalVolatileUrl) {
      return new Promise<any[]>(resolve => resolve());
    }

    if (!fieldConfig.templateOptions.customFieldConfig.fullOptionsUrl) {
      url = this.urlWithBasePath(fieldConfig.templateOptions.customFieldConfig.optionsUrl,
        fieldConfig.templateOptions.customFieldConfig.urlQueryParams);
    } else {
      url = fieldConfig.templateOptions.customFieldConfig.fullOptionsUrl;
    }

    return this.formlyHelpersApi.getCaching<any[]>(url, noCache).pipe(tap(value => {
      fieldConfig.templateOptions.options = value;
    }), take(1)).toPromise();
  }

  public patchDynamicFieldConfig(fieldConfig: FormlyFieldConfig): void {
    if (fieldConfig.type !== 'dynamic') {
      return;
    }
    const fieldTypes: any[] = fieldConfig.templateOptions?.customFieldConfig?.fieldTypes;
    if (!fieldTypes?.length) {
      console.error('no fieldTypes provided for type=entity field "' + fieldConfig.key + '"');
      return;
    }
    const to = fieldConfig.templateOptions;
    const clonedTo = clone(to);
    const cfg = to.customFieldConfig;
    cfg.selectedType = fieldTypes[0].type;

    const fieldGroup = fieldConfig.fieldGroup;
    fieldConfig.fieldGroup = undefined;
    const subFields: FormlyFieldConfig[] = [];
    for (const crtType of fieldTypes) {
      const crtField: FormlyFieldConfig = {
        key: crtType.type,
        type: crtType.type !== 'subGroup' ? crtType.type : '',
        templateOptions: clone(clonedTo),
      };
      if (crtType.keepFieldGroup) {
        crtField.fieldGroup = fieldGroup;
        crtField.fieldGroupClassName = fieldConfig.fieldGroupClassName;
      }
      if (crtType.validation?.length) {
        crtField.validators = deepmerge(crtField.validators, {validation: crtType.validation});
      }
      subFields.push(crtField);
    }
    to.customFields = subFields;
  }

  public urlWithBasePath(urlStr: string, queryParams?: { [key: string]: string }): string {
    try {
      const url = new URL(urlStr);
      if (typeof this.basePath === 'string' && this.basePath) {
        url.pathname = this.basePath + url.pathname;
      }
      if (queryParams) {
        for (const pk in queryParams) {
          if (queryParams.hasOwnProperty(pk)) {
            url.searchParams.set(pk, queryParams[pk]);
          }
        }
      }
      return url.toString();
    } catch (e) {
      // fallback
      console.error(e);
      return urlStr;
    }
  }


  public buildFormStateVolatileObject(fields: FormlyFieldConfig[]): any {
    const vObj = {};

    for (const field of fields) {
      this.buildFormStateVolatileObjectForField(field, vObj);
    }
    // console.log(vObj);
    return vObj;
  }

  private buildFormStateVolatileObjectForField(field: FormlyFieldConfig, vObj: any): void {
    if (field.fieldGroup?.length) {
      for (const formlyFieldConfig of field.fieldGroup) {
        this.buildFormStateVolatileObjectForField(formlyFieldConfig, vObj);
      }
    }
    if (field.fieldArray) {
      this.buildFormStateVolatileObjectForField(field.fieldArray, vObj);
    }

    if (field.templateOptions?.customFieldConfig?.globalVolatileUrl) {
      const cc = field.templateOptions?.customFieldConfig;
      if (!cc.optionsUrl) {
        throw new Error('Found a field with \'globalVolatileUrl\' on a field but no \'optionsUrl\' present.');
      }
      if (vObj[cc.optionsUrl]) {
        return;
      }
      const cObj = vObj[cc.globalVolatileUrl] = {
        get queryParams(): any {
          return this._queryParams;
        },
        set queryParams(value: any) {
          if (areEqual(this._queryParams, value)) {
            return;
          }
          this._queryParams = value;
          this.queryParamsChanged.next(this._queryParams);
        },
        valueChanges: new Subject<any>(),
        value: [],
        queryParamsChanged: new Subject<any>(),
        urlPath: cc.optionsUrl,
        subscription: null,
        latestUrl: null,
        reload: () => {
          this.formlyHelpersApi.clearCacheAndTriggerRequest(cObj.latestUrl);
        },
      };
      cObj.queryParamsChanged.subscribe(async qp => {
        cObj.latestUrl = this.urlWithBasePath(cObj.urlPath, cObj.queryParams);
        cObj.subscription?.unsubscribe();
        cObj.subscription = this.formlyHelpersApi.getCaching<any[]>(cObj.latestUrl).subscribe(newValue => {
          if (areEqual(newValue, cObj.value)) {
            return;
          }
          cObj.value = newValue;
          cObj.valueChanges.next(newValue);
        });
      });
    }
  }
}
