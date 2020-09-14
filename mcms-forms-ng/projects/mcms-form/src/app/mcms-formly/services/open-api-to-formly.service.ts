import { Injectable } from '@angular/core';
import { OpenApiConfigService } from './open-api-config.service';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { IExtendedOpenApiProperty, IOpenApiDocument, IOpenApiProperty, IOpenApiSchema } from '../models/open-api-models';
import * as deepmerge from 'deepmerge';
import { Validators } from '@angular/forms';
import clone from 'clone';
import { FormlyHelpersApiService } from './formly-helpers-api.service';
import safeEvalFormlyExpression from './safe-eval-formly-expression';

@Injectable()
export class OpenApiToFormlyService {
  private defaultFieldConfig: FormlyFieldConfig = {className: 'full-width'};

  private openApiDoc: IOpenApiDocument;
  private schemaFieldConfigs: { [key: string]: FormlyFieldConfig[] } = {};

  private typeMap: { [key: string]: string } = {
    string: 'input',
    boolean: 'checkbox',
    integer: 'input',
    object: 'formly-group',
  };
  private formatChangeTypeMap: { [key: string]: string } = {
    multiline: 'textarea',
    select: 'select',
    date: 'date',
    time: 'time',
    'date-time': 'date-time',
    float: 'input',
    double: 'input',
  };

  private formatMap: { [key: string]: string } = {
    int32: 'number',
    float: 'number',
    double: 'number',
  };
  private fieldsToCopyToTemplateObject: Array<string | string[]> = [
    'minLength', 'maxLength', ['minimum', 'min'], ['maximum', 'max'],
  ];


  constructor(
    private openApiConfigService: OpenApiConfigService,
    private formlyHelpersApi: FormlyHelpersApiService,
  ) {
  }

  private async getOrCreateSchema(schemaName: string): Promise<FormlyFieldConfig[]> {
    if (!this.schemaFieldConfigs.hasOwnProperty(schemaName)) {
      await this.createFieldConfigsFromOpenApiSchemaName(schemaName);
    }
    return this.schemaFieldConfigs[schemaName];
  }

  private async createFieldConfigsFromOpenApiSchemaName(schemaName: string): Promise<void> {
    const schema = this.getSchemaOrThrow(schemaName);
    if (!schema['x-formly-patched']) {
      throw new Error(`You are trying to use schema with name '${schemaName}'. ` +
        `This OpenApi3 Schema isn't patched for Formly. Did you forget to inherit IFormModel in this C# class?`);
    }
    this.schemaFieldConfigs[schemaName] = await this.getFieldConfigsFromOpenApiSchema(schema);
  }

  private async getFieldConfigsFromOpenApiSchema(schema: IOpenApiSchema): Promise<FormlyFieldConfig[]> {
    const fieldConfigs: FormlyFieldConfig[] = [];
    for (const key in schema.properties) {
      if (!schema.properties.hasOwnProperty(key)) {
        continue;
      }
      let prop = schema.properties[key];
      if (prop['x-formlyIgnore']) {
        continue;
      }

      if (prop.allOf && prop.allOf.length) {
        const allOf = prop.allOf;
        for (const allOfi of allOf) {
          if (!allOfi.$ref) {
            // this should not happen
            console.error('but happened');
            continue;
          }
          const targetSchema = this.getSchemaOrThrow(this.getSchemaNameFromRef(allOfi.$ref));
          if (targetSchema.type === 'object') {
            prop.subGroupRefs = prop.subGroupRefs || [];
            prop.subGroupRefs.push(allOfi.$ref);
          } else if (targetSchema.enum) {
            prop = deepmerge(targetSchema, prop, {});
          }
        }
        delete prop.allOf;
      }
      fieldConfigs.push(await this.getFieldConfigFromProperty(prop as IExtendedOpenApiProperty, key, schema));
    }
    return fieldConfigs;
  }

  private async getFieldConfigFromProperty(prop: IExtendedOpenApiProperty, key: string, schema: IOpenApiSchema):
    Promise<FormlyFieldConfig> {
    const fieldConfig: FormlyFieldConfig = {
      ...this.defaultFieldConfig,
      key,
      type: this.formatChangeTypeMap[prop.format] || this.typeMap[prop.type] || prop.type,
      templateOptions: deepmerge({type: this.formatMap[prop.format] || prop.format}, prop['x-templateOptions']),
      validators: prop.validators || undefined,
    };

    this.copyNeededFields(prop, fieldConfig);

    if (fieldConfig.templateOptions.autoFill) {
      this.buildAutoFill(fieldConfig);
    }

    if (prop.subGroupRefs) {
      fieldConfig.fieldGroup = [];
      for (const subGroupRef of prop.subGroupRefs) {
        fieldConfig.fieldGroup.push(...await this.getOrCreateSchema(this.getSchemaNameFromRef(subGroupRef)));
      }
    }
    if (prop.type === 'array' && prop.items?.$ref) {
      fieldConfig.fieldArray = {
        fieldGroup: await this.getOrCreateSchema(this.getSchemaNameFromRef(prop.items?.$ref)),
        ...fieldConfig.fieldArray,
      };
    }

    if (fieldConfig.type === 'select' || fieldConfig.type === 'autocomplete') {
      await this.patchCustomOptionsConfig(fieldConfig);
    }
    this.buildValidators(prop, fieldConfig);
    return fieldConfig;
  }

  private buildAutoFill(fieldConfig: FormlyFieldConfig): void {
    let autoFillConfig = fieldConfig.templateOptions.autoFill;
    if (autoFillConfig.onlyIfUntouched && autoFillConfig.checkIfTouchedOnInit) {
      fieldConfig.hooks = {
        onInit: field => {
          autoFillConfig = field.templateOptions.autoFill;

          const autoFillValue = safeEvalFormlyExpression(autoFillConfig.expression, field);
          autoFillConfig.enabled = field.formControl.value === autoFillValue;

          if (autoFillConfig.forceEnableIfSourceChanged) {
            autoFillConfig.tmpAutoFillValue = autoFillValue;
            field.form.valueChanges.subscribe(_ => {
              if (autoFillConfig.enabled) {
                return;
              }
              const crt = safeEvalFormlyExpression(autoFillConfig.expression, field);
              if (crt !== autoFillConfig.tmpAutoFillValue) {
                autoFillConfig.enabled = true;
              }
            });
          }
        },
      };
    }

    const target = 'model.' + fieldConfig.key;

    fieldConfig.expressionProperties = {
      ...fieldConfig.expressionProperties,
    };
    fieldConfig.expressionProperties[target] =
      'field.templateOptions.autoFill.enabled ? safeEvalFormlyExpression("' + autoFillConfig.expression + '", field) : ' + target;
  }

  private buildValidators(prop: IOpenApiProperty, fieldConfig: FormlyFieldConfig): void {
    if (!prop['x-validators']) {
      return;
    }
    for (const validator of prop['x-validators']) {
      if (Validators.hasOwnProperty(validator.name)) {
        if (!fieldConfig.validators) {
          fieldConfig.validators = {validation: []};
        }
        let fValidator = Validators[validator.name];
        if (typeof validator.args !== 'undefined') {
          fValidator = fValidator(validator.args);
        }
        fieldConfig.validators.validation.push(fValidator);
      }
      if (validator.message) {
        if (!fieldConfig.validation) {
          fieldConfig.validation = {messages: {}};
        } else if (!fieldConfig.validation.messages) {
          fieldConfig.validation.messages = {};
        }
        fieldConfig.validation.messages[validator.name] = this.tryTranslate(validator.message);
      }
      if (validator.name === 'required') {
        fieldConfig.templateOptions.required = true;
      }
      if (validator.name === 'pattern') {
        fieldConfig.templateOptions.pattern = validator.args;
      }
    }
  }

  private tryTranslate(msg: string): string {
    const trans = this.openApiConfigService.getTranslationsDict(this.openApiDoc);
    return trans.hasOwnProperty(msg) ? trans[msg] : msg;
  }

  private copyNeededFields(prop: IOpenApiProperty, fieldConfig: FormlyFieldConfig): void {
    const setIfNotUndefined: (target, propName, value) => void = (target, propName, value) => {
      if (typeof value !== 'undefined') {
        target[propName] = value;
      }
    };
    for (const f of this.fieldsToCopyToTemplateObject) {
      if (typeof f === 'string') {
        setIfNotUndefined(fieldConfig.templateOptions, f, prop[f]);
      } else {
        setIfNotUndefined(fieldConfig.templateOptions, f[1], prop[f[0]]);
      }
    }

    const xProps = prop['x-props'];
    if (xProps) {
      for (const propKey in xProps) {
        if (!xProps.hasOwnProperty(propKey)) {
          continue;
        }
        let targetObj = fieldConfig;
        const propPath = propKey.split('/').filter((pp) => pp);
        const propName = propPath[propPath.length - 1];
        propPath.length--;
        for (const pathPart of propPath) {
          if (typeof targetObj[pathPart] === 'undefined') {
            targetObj[pathPart] = {};
          }
          targetObj = targetObj[pathPart] = targetObj[pathPart] || {};
        }
        targetObj[propName] = xProps[propKey];
      }
    }
  }

  private getSchemaOrThrow(schemaName: string): IOpenApiSchema {
    if (!this.openApiDoc.components.schemas.hasOwnProperty(schemaName)) {
      throw new Error(`There is no schema named '${schemaName}' in this open api 3 document`);
    }
    return this.openApiDoc.components.schemas[schemaName];
  }

  private async ensureOpenApiConfigLoaded(): Promise<void> {
    if (!this.openApiDoc) {
      try {
        this.openApiDoc = await this.openApiConfigService.getConfig().toPromise();
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
  }

  private getSchemaNameFromRef(refPath: string): string {
    const pathParts = refPath.split('/').filter((part) => part !== '#');
    return pathParts[2];
  }


  public async getConfig(schemaName: string): Promise<any[]> {
    await this.ensureOpenApiConfigLoaded();
    return clone(await this.getOrCreateSchema(schemaName));
  }

  public clearCache(): void {
    this.schemaFieldConfigs = {};
    this.openApiConfigService.clearCache();
    this.openApiDoc = null;
  }

  private async patchCustomOptionsConfig(fieldConfig: FormlyFieldConfig): Promise<void> {
    if (!fieldConfig || !fieldConfig.templateOptions || !fieldConfig.templateOptions.customFieldConfig) {
      return;
    }
    const customFieldConfig = fieldConfig.templateOptions.customFieldConfig;
    if (customFieldConfig.optionsUrl) {
      fieldConfig.templateOptions.options = await this.formlyHelpersApi.get<any[]>(customFieldConfig.optionsUrl).toPromise();
      fieldConfig.templateOptions.valueProp = o => o;
      fieldConfig.templateOptions.labelProp = customFieldConfig.labelProp;
      if (customFieldConfig.valueProp) {
        fieldConfig.templateOptions.compareWith = (o1, o2) => o1 === o2 ||
          (o1 && o2 && o1[customFieldConfig.valueProp] === o2[customFieldConfig.valueProp]);
      }
    }
  }

}
