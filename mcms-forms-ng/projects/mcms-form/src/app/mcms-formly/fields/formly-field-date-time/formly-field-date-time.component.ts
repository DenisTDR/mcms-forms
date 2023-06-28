import { Component, OnDestroy, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { UntypedFormControl } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbTimeAdapter } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from '../formly-field-date/custom-date-adapter.service';
import { CustomDateParserFormatter } from '../formly-field-date/custom-date-parser.formatter';
import { CustomTimeAdapter } from '../formly-field-time/custom-time-adapter';
import { Subscription } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mcms-field-date-time',
  templateUrl: './formly-field-date-time.component.html',
  styleUrls: ['./formly-field-date-time.component.scss'],
  providers: [
    CustomDateAdapter,
    CustomTimeAdapter,
    {provide: NgbTimeAdapter, useClass: CustomTimeAdapter},
    {provide: NgbDateAdapter, useClass: CustomDateAdapter},
    {provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter},
  ],
})
export class FormlyFieldDateTimeComponent extends FieldType implements OnInit {
  public timeFormControl: UntypedFormControl = new UntypedFormControl();
  public dateFormControl: UntypedFormControl = new UntypedFormControl();


  constructor(
    private dateAdapter: CustomDateAdapter,
    private timeAdapter: CustomTimeAdapter,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.formControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.propagateForward();
    });
    this.timeFormControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.propagateBackward();
    });
    this.dateFormControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.propagateBackward();
    });
    this.propagateForward();
  }

  private propagateForward(): void {
    const value = this.formControl.value;
    if (!value) {
      return;
    }
    const split = value.split(value.includes('T') ? 'T' : ' ');
    if (split[0] !== this.dateFormControl.value) {
      this.dateFormControl.setValue(this.dateAdapter.placeholderProject(split[0]));
    }
    if (!split[1] && split[0] === '{now}') {
      this.timeFormControl.setValue(this.timeAdapter.placeholderProject(split[0]));
    } else if (split[1] !== this.timeFormControl.value) {
      this.timeFormControl.setValue(this.timeAdapter.placeholderProject(split[1]));
    }
  }

  private propagateBackward(): void {
    const value = [this.dateFormControl.value, this.timeFormControl.value].filter(v => v).join('T');
    if (this.formControl.value !== value) {
      this.formControl.setValue(value);
    }
  }
}
