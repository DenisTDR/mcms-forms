import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'mcms-field-textarea',
  template: `
    <textarea [formControl]="formControl"
              [cols]="to.cols"
              [rows]="to.rows"
              class="form-control"
              [class.is-invalid]="showError"
              [formlyAttributes]="field"
              autosize>
    </textarea>
  `,
})
export class FormlyFieldTextareaComponent extends FieldType {
  public defaultOptions = {
    templateOptions: {
      cols: 1,
      rows: 1,
    },
  };
}
