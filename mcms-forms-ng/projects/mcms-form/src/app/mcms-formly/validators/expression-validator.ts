import { UntypedFormControl, ValidationErrors } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ExpressionValidatorArgs } from './expression-validator-args';

// this is an async validator because expression properties are processed after sync validators
// => we need to wait for expression properties
export async function expressionValidator(control: UntypedFormControl, field: FormlyFieldConfig, {args}: { args: ExpressionValidatorArgs })
  : Promise<ValidationErrors> {
  if (!args) {
    throw new Error('no args provided for Expression Validator');
  }
  await new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    });
  });
  if (!field.templateOptions.expressionValidatorResults[args.key]) {
    const obj = {};
    obj[args.key] = true;
    return obj;
  }
  return null;
}
