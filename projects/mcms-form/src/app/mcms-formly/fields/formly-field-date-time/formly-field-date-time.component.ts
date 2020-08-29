import { Component, OnDestroy, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { FormControl } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbTimeAdapter } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateAdapter } from '../formly-field-date/custom-date-adapter.service';
import { CustomDateParserFormatter } from '../formly-field-date/custom-date-parser.formatter';
import { CustomTimeAdapter } from '../formly-field-time/custom-time-adapter';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-formly-field-date-time',
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
export class FormlyFieldDateTimeComponent extends FieldType implements OnInit, OnDestroy {
  public timeFormControl: FormControl = new FormControl();
  public dateFormControl: FormControl = new FormControl();

  private subscriptions: Subscription[];

  constructor(
    private dateAdapter: CustomDateAdapter,
    private timeAdapter: CustomTimeAdapter,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.subscriptions = [
      this.formControl.valueChanges.subscribe(value => {
        this.propagateForward();
      }),
      this.timeFormControl.valueChanges.subscribe(value => {
        this.propagateBackward();
      }),
      this.dateFormControl.valueChanges.subscribe(value => {
        this.propagateBackward();
      }),
    ];
    this.propagateForward();
  }

  private propagateForward() {
    const value = this.formControl.value;
    if (!value) {
      return;
    }
    const split = value.split('T');
    if (split[0] !== this.dateFormControl.value) {
      this.dateFormControl.setValue(this.dateAdapter.placeholderProject(split[0]));
    }
    if (!split[1] && split[0] === '{now}') {
      this.timeFormControl.setValue(this.timeAdapter.placeholderProject(split[0]));
    } else if (split[1] !== this.timeFormControl.value) {
      this.timeFormControl.setValue(this.timeAdapter.placeholderProject(split[1]));
    }
  }

  private propagateBackward() {
    const value = [this.dateFormControl.value, this.timeFormControl.value].filter(v => v).join('T');
    if (this.formControl.value !== value) {
      this.formControl.setValue(value);
    }
  }

  public ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}
