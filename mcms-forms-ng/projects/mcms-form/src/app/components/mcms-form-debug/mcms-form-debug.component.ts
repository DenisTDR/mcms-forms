import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'mcms-form-debug',
  template: `
    <div class="col-6">
      fieldsClone
      <pre>{{safeFields | json}}</pre>
    </div>
    <div class="col-6">
      <div>
        form.valid: {{safeValid}}
      </div>
      <div>
        model:
        <pre>{{safeModel | json}}</pre>
      </div>
      <div>
        formState:
        <pre>{{safeFormState | json}}</pre>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }`,
  ],
})
export class McmsFormDebugComponent implements OnChanges {

  public safeFields: FormlyFieldConfig[];
  public safeValid: boolean;
  public safeModel: any;
  public safeFormState: any;

  @Input() public fields: FormlyFieldConfig[];
  @Input() public valid: boolean;
  @Input() public model: any;
  @Input() public formState: any;

  public ngOnChanges(changes: SimpleChanges): void {
    setTimeout(() => {
      if (changes.fields) {
        this.safeFields = this.fields;
      }
      if (changes.valid) {
        this.safeValid = this.valid;
      }
      if (changes.model) {
        this.safeModel = this.model;
      }
      if (changes.formState) {
        this.safeFormState = this.formState;
      }
    }, 200);
  }

}
