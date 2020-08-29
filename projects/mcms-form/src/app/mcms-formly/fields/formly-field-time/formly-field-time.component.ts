import { Component, OnInit } from '@angular/core';
import { CustomTimeAdapter } from './custom-time-adapter';
import { NgbTimeAdapter } from '@ng-bootstrap/ng-bootstrap';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'app-formly-field-time',
  templateUrl: './formly-field-time.component.html',
  providers: [
    CustomTimeAdapter,
    {provide: NgbTimeAdapter, useClass: CustomTimeAdapter},
  ],
})
export class FormlyFieldTimeComponent extends FieldType implements OnInit {
  constructor(
    private timeAdapter: CustomTimeAdapter,
  ) {
    super();
  }

  public ngOnInit(): void {
    if (this.formControl.value === '{now}') {
      this.formControl.setValue(this.timeAdapter.placeholderProject(this.formControl.value));
    }
  }
}
