import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import clone from 'clone';

@Component({
  selector: 'mcms-form-debug',
  template: `
    <ng-container>
      <div class="col-6" *ngIf="!hidden">
        fieldsClone
        <pre>{{safeFields | json}}</pre>
      </div>
      <div class="col-6" *ngIf="hidden"></div>
      <div class="col-6" style="min-height: 36px">
        <ng-container *ngIf="!hidden">
          <div>
            form.valid: {{safeValid}}
          </div>
          <div>
            model:
            <pre>{{safeModel | json}}</pre>
          </div>
          <div>
            formState:
            <pre>{{makeSafeForStringify(safeFormState) | json}}</pre>
          </div>
          <div>
            options:
            <pre>{{safeOptions | json}}</pre>
          </div>
        </ng-container>
        <div style="position: absolute; top: 0; right: 32px;">
          <button class="btn btn-outline-secondary" (click)="toggleVisibility()">Toggle debug</button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host {
      display: contents;
    }`,
  ],
})
export class McmsFormDebugComponent implements OnChanges {

  public hidden: boolean;

  public safeFields: FormlyFieldConfig[];
  public safeValid: boolean;
  public safeModel: any;
  public safeFormState: any;
  public safeOptions: any;

  @Input() public fields: FormlyFieldConfig[];
  @Input() public valid: boolean;
  @Input() public model: any;
  @Input() public formState: any;
  @Input() public options: any;

  constructor() {
    this.hidden = localStorage.getItem('formly-debug-hidden') === 'true' || false;
  }

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
      if (changes.options) {
        this.safeOptions = this.options;
      }
    }, 200);
  }

  public toggleVisibility(): void {
    this.hidden = !this.hidden;
    localStorage.setItem('formly-debug-hidden', this.hidden.toString());
  }

  public makeSafeForStringify(formState: any): any {
    if (!formState) {
      return null;
    }
    const fs = clone(formState);
    if (fs.vObj) {
      for (const vObjKey in fs.vObj) {
        if (!fs.vObj.hasOwnProperty(vObjKey)) {
          continue;
        }
        // console.log(fs.vObj[vObjKey]);
        delete fs.vObj[vObjKey].queryParamsChanged;
        delete fs.vObj[vObjKey].valueChanges;
        delete fs.vObj[vObjKey].subscription;
      }
    }
    return fs;
  }

}
