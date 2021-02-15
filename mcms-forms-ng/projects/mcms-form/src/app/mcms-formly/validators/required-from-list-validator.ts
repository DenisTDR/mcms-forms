import { FormControl, ValidationErrors } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

export default function requiredFromListValidator(
  control: FormControl, field: FormlyFieldConfig): ValidationErrors {
  if (!control.value) {
    return null;
  }
  const list: any[] = field.templateOptions.options as any[];
  const val = control.value;
  if (list.some(li => field.templateOptions.compareWith(li, val))) {
    return null;
  }
  return {'required-from-list': true};
}
