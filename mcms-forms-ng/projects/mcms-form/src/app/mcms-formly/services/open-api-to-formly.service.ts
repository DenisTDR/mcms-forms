import { Injectable } from '@angular/core';
import { OpenApiConfigService } from './open-api-config.service';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { IExtendedOpenApiProperty, IOpenApiDocument, IOpenApiProperty, IOpenApiSchema } from '../models/open-api-models';
import * as deepmerge from 'deepmerge';
import { AbstractControl, Validators } from '@angular/forms';
import clone from 'clone';
import { FormlyHelpersApiService } from './formly-helpers-api.service';
import safeEvalFormlyExpression from './safe-eval-formly-expression';
import { ExpressionValidatorArgs } from '../validators/expression-validator-args';
import { FormlyFileFieldConfig } from '../fields/formly-field-file/formly-file-field-models';
import { TranslateService } from './translate.service';
import OpenApiConfigHelper from './open-api-config-helper';

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
    'minItems', 'maxItems',
  ];

  public helper: OpenApiConfigHelper;

  constructor(
    private openApiConfigService: OpenApiConfigService,
    private formlyHelpersApi: FormlyHelpersApiService,
    private trans: TranslateService,
  ) {
    this.helper = new OpenApiConfigHelper(formlyHelpersApi);
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
    if (fieldConfig.type === 'file' && fieldConfig.templateOptions.customFieldConfig) {
      this.patchFileFieldLinksConfig(fieldConfig);
    }

    await this.helper.patchCustomOptionsConfig(fieldConfig);
    this.trans.translate(fieldConfig);
    this.buildValidators(prop, fieldConfig);
    await this.helper.patchDynamicFieldConfig(fieldConfig);

    return fieldConfig;
  }

  private buildAutoFill(fieldConfig: FormlyFieldConfig): void {
    let autoFillConfig = fieldConfig.templateOptions.autoFill;
    // TODO: this code needs documentation because idk why it's working :))
    fieldConfig.hooks = {
      onInit: field => {
        if (autoFillConfig.onlyIfUntouched && autoFillConfig.checkIfTouchedOnInit) {
          autoFillConfig = field.templateOptions.autoFill;

          const computedValue = safeEvalFormlyExpression(autoFillConfig.expression, field);

          if (autoFillConfig.useAsDefaultValue && field.formControl.value === null) {
            field.formControl.setValue(computedValue);
          }

          autoFillConfig.enabled = field.formControl.value === computedValue;
          if (autoFillConfig.forceEnableIfSourceChanged) {
            autoFillConfig.tmpAutoFillValue = computedValue;
            // field.form
            this.getRootForm(field.form).valueChanges.subscribe(_ => {
              if (autoFillConfig.enabled) {
                return;
              }
              const crt = safeEvalFormlyExpression(autoFillConfig.expression, field);
              if (crt !== autoFillConfig.tmpAutoFillValue) {
                autoFillConfig.enabled = true;
              }
            });
          }
        }

        if (autoFillConfig.enableExpression) {
          autoFillConfig.enableExpressionResult = safeEvalFormlyExpression(autoFillConfig.enableExpression, field);
          if (autoFillConfig.enableExpressionResult) {
            field.formControl.setValue(safeEvalFormlyExpression(autoFillConfig.expression, field));
          }
        }

        // field.form
        this.getRootForm(field.form).valueChanges.subscribe(value => {
          if (!autoFillConfig.enabled || autoFillConfig.enableExpressionResult === false) {
            return;
          }
          const nowValue = safeEvalFormlyExpression(autoFillConfig.expression, field);
          if (autoFillConfig.lastAutoFillValue !== nowValue) {
            autoFillConfig.lastAutoFillValue = nowValue;
            if (nowValue !== field.formControl.value) {
              field.formControl.setValue(nowValue);
            }
          }
        });
      },
    };

    fieldConfig.expressionProperties = {
      ...fieldConfig.expressionProperties,
    };
    if (autoFillConfig.enableExpression) {
      fieldConfig.expressionProperties['templateOptions.autoFill.enableExpressionResult'] = autoFillConfig.enableExpression;
    }
  }

  private getRootForm(formControl: AbstractControl): AbstractControl {
    if (formControl?.parent == null) {
      return formControl;
    }
    return this.getRootForm(formControl.parent);
  }

  private buildValidators(prop: IOpenApiProperty, fieldConfig: FormlyFieldConfig): void {
    if (!prop['x-validators']) {
      return;
    }
    for (const validator of prop['x-validators']) {
      if (!fieldConfig.validators) {
        fieldConfig.validators = {validation: []};
      }
      if (Validators.hasOwnProperty(validator.name)) {
        let fValidator = Validators[validator.name];
        if (typeof validator.args !== 'undefined') {
          if (validator.name === 'pattern' && typeof validator.args === 'string') {
            validator.args = new RegExp(validator.args, 'u');
          }
          fValidator = fValidator(validator.args);
        }
        fieldConfig.validators.validation.push(fValidator);
      }
      if (validator.name === 'expressionValidator') {
        this.buildExpressionValidator(validator.args, fieldConfig);
        validator.name = validator.args.key;
      }
      if (validator.name === 'required-from-list') {
        this.addValidation(fieldConfig, 'required-from-list');
      }
      if (validator.message) {
        if (!fieldConfig.validation) {
          fieldConfig.validation = {messages: {}};
        } else if (!fieldConfig.validation.messages) {
          fieldConfig.validation.messages = {};
        }
        fieldConfig.validation.messages[validator.name] = this.trans.tryTranslate(validator.message);
      }
      if (validator.name === 'required') {
        fieldConfig.templateOptions.required = true;
      }
      if (validator.name === 'pattern') {
        fieldConfig.templateOptions.pattern = validator.args;
      }
    }
  }

  private buildExpressionValidator(args: ExpressionValidatorArgs, fieldConfig: FormlyFieldConfig): void {
    if (!args) {
      throw new Error('no args provided for Expression Validator');
    }
    if (!fieldConfig.expressionProperties) {
      fieldConfig.expressionProperties = {};
    }
    if (!fieldConfig.templateOptions.expressionValidatorResults) {
      fieldConfig.templateOptions.expressionValidatorResults = {};
    }
    fieldConfig.expressionProperties['templateOptions.expressionValidatorResults.' + args.key] = args.expression;

    const asyncValidators = fieldConfig.asyncValidators || {validation: []};
    if (!asyncValidators.validation) {
      asyncValidators.validation = [];
    }
    asyncValidators.validation.push({name: 'expression-validator', options: {args}});

    fieldConfig.asyncValidators = asyncValidators;
  }

  private addValidation(fieldConfig: FormlyFieldConfig, name: string): void {
    fieldConfig.validators.validation.push(name);
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
        if (propKey === 'clone-key') {
          fieldConfig.key = xProps[propKey];
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


  public async getConfig(schemaName: string): Promise<FormlyFieldConfig[]> {
    await this.ensureOpenApiConfigLoaded();
    const fields = await this.getOrCreateSchema(schemaName);
    const cloned = clone(fields);
    this.fixClonedPatterns(cloned);
    return cloned;
  }

  private fixClonedPatterns(cloned: FormlyFieldConfig[]): void {
    // fix cloned RegExp flags in templateOptions.pattern
    for (const field of cloned) {
      if (field.fieldGroup) {
        this.fixClonedPatterns(field.fieldGroup);
      }
      if (!field || !field.templateOptions || !field.templateOptions.pattern) {
        continue;
      }
      if (typeof field.templateOptions.pattern === 'string') {
        field.templateOptions.pattern = new RegExp(field.templateOptions.pattern, 'u');
      } else if (field.templateOptions.pattern instanceof RegExp) {
        field.templateOptions.pattern = new RegExp(field.templateOptions.pattern, 'u');
      }
    }
  }

  public clearCache(): void {
    this.schemaFieldConfigs = {};
    this.openApiConfigService.clearCache();
    this.openApiDoc = null;
  }

  private patchFileFieldLinksConfig(fieldConfig: FormlyFieldConfig): void {
    const fileConfig = fieldConfig.templateOptions.customFieldConfig as FormlyFileFieldConfig;
    fileConfig.uploadUrl = this.helper.urlWithBasePath(fileConfig.uploadUrl);
    fileConfig.deleteUrl = this.helper.urlWithBasePath(fileConfig.deleteUrl);
  }
}
