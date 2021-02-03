import { FormControl, ValidationErrors } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

export default function requiredFromListValidator(
  control: FormControl, field: FormlyFieldConfig): ValidationErrors {
  const list: any[] = field.templateOptions.options as any[];
  const compareWith = field.templateOptions.compareWith;
  const val = control.value;
  if (list.some(li => compareWith(li, val))) {
    return null;
  }
  return {'required-from-list': true};
}
