import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyHelpersApiService } from './formly-helpers-api.service';
import clone from 'clone';
import * as deepmerge from 'deepmerge';

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
    if (customFieldConfig.optionsUrl) {
      const url = this.urlWithBasePath(customFieldConfig.optionsUrl);
      fieldConfig.templateOptions.options = await this.formlyHelpersApi.get<any[]>(url).toPromise();
      fieldConfig.templateOptions.valueProp = o => o;
      fieldConfig.templateOptions.labelProp = customFieldConfig.labelProp;
      if (customFieldConfig.valueProp) {
        fieldConfig.templateOptions.compareWith = (o1, o2) => o1 === o2 ||
          (o1 && o2 && o1[customFieldConfig.valueProp] === o2[customFieldConfig.valueProp]);
      }
    }
  }

  public patchDynamicFieldConfig(fieldConfig: FormlyFieldConfig): void {
    if (fieldConfig.type !== 'dynamic') {
      return;
    }
    // fieldConfig.wrappers = fieldConfig.wrappers || ['form-field'];
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

  public urlWithBasePath(urlStr: string): string {
    if (typeof this.basePath === 'undefined' || !this.basePath) {
      return urlStr;
    }
    try {
      const url = new URL(urlStr);
      url.pathname = this.basePath + url.pathname;
      return url.toString();
    } catch (e) {
      // fallback
      console.error(e);
      return urlStr;
    }
  }
}
