import { Component, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from './custom-date-adapter.service';
import { CustomDateParserFormatter } from './custom-date-parser.formatter';

@Component({
  selector: 'mcms-field-date',
  template: `
    <input
      [formControl]="formControl"
      class="form-control"
      [formlyAttributes]="field"
      [class.is-invalid]="showError"
      container="body"
      ngbDatepicker
      #d="ngbDatepicker"
      (click)="d.toggle()"
    />
  `,
  providers: [
    CustomDateAdapter,
    {provide: NgbDateAdapter, useClass: CustomDateAdapter},
    {provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter},
  ],
})
export class FormlyFieldDateComponent extends FieldType implements OnInit {

  constructor(
    private dateAdapter: CustomDateAdapter,
  ) {
    super();
  }

  public ngOnInit(): void {
    if (this.formControl.value === '{now}') {
      this.formControl.setValue(this.dateAdapter.placeholderProject(this.formControl.value));
    }
  }
}
