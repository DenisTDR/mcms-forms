import { Component, Input, OnInit } from '@angular/core';
import { FormlyFieldConfig, FormlyFormOptions, FormlyTemplateOptions } from '@ngx-formly/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup } from '@angular/forms';
import clone from 'clone';

@Component({
  selector: 'mcms-field-fill-button',
  template: `
    <button class="ml-2 btn btn-secondary"
            type="button"
            [innerHTML]="buttonContent"
            (click)="openModal(modalContentTemplate)"></button>
    <ng-template #modalContentTemplate let-modal>
      <div class="modal-header">
        <h4 class="modal-title">{{to.label}}</h4>
        <button type="button" class="close" aria-label="Close" (click)="modal.dismiss()">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form novalidate [formGroup]="form">
          <formly-form [fields]="subFields" [form]="form" [model]="model" [options]="options"></formly-form>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.close()">Close</button>
        <button type="button" class="btn btn-outline-dark" (click)="modal.close('save')">Save</button>
      </div>
    </ng-template>
  `,
  styles: [],
})
export class FieldFillButtonComponent {

  public get buttonContent(): string {
    return this.fgf?.buttonContent || '<i class=\'fas fa-fill-drip mr-1\'></i> Fill';
  }

  public get to(): FormlyTemplateOptions {
    return this.field.templateOptions;
  }

  public get cc(): any {
    return this.to.customFieldConfig;
  }

  public get fgf(): any {
    return this.cc.fieldGroupFill;
  }

  public subFields: FormlyFieldConfig[];
  public form: FormGroup = new FormGroup({});
  public model: { fillValue?: any } = {};
  public options: FormlyFormOptions = {};

  @Input()
  public field: FormlyFieldConfig;

  constructor(private modalService: NgbModal) {
  }

  public openModal(content): void {
    this.subFields = [{
      type: this.cc?.fieldGroupFill?.selectorFieldType || 'select',
      key: 'fillValue',
      templateOptions: {...this.field.templateOptions, disabled: false},
    }];
    this.modalService.open(content).result.then((result) => {
      if (result !== 'save' || !this.model.fillValue) {
        return;
      }
      const valToFill = clone(this.model.fillValue);
      if (this.cc.valueProp && !this.fgf.keepValueProp) {
        delete valToFill[this.to.valueProp];
      }
      this.field.formControl.patchValue(valToFill);
      this.field.model[this.cc.valueProp] = this.model.fillValue[this.cc.valueProp];
    });
  }
}
