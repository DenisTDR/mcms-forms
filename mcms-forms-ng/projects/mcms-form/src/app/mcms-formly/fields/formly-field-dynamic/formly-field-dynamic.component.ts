import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { FieldType, FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import clone from 'clone';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mcms-field-dynamic',
  template: `
    <form novalidate [formGroup]="form" *ngIf="subFields?.length">
      <formly-form [model]="subModel" [fields]="subFields" [options]="subOptions" [form]="subForm">
      </formly-form>
    </form>
  `,
})
export class FormlyFieldDynamicComponent extends FieldType implements OnInit {
  public subForm = new FormGroup({});
  public subModel: any = {};
  public subOptions: FormlyFormOptions = {};

  private flag: boolean;

  public subFields: FormlyFieldConfig[];

  public get selectedType(): string {
    return this.to.customFieldConfig.selectedType;
  }

  public get selectedControl(): AbstractControl {
    return this.subForm.controls[this.selectedType];
  }

  public ngOnInit(): void {
    if (this.to.shouldSetNullChange) {
      this.to.shouldSetNullChange.pipe(untilDestroyed(this)).subscribe(_ => {
        if (this.to.shouldSetNull) {
          this.subForm.reset();
          this.subForm.disable();
        } else {
          this.subForm.reset({});
          this.subForm.enable();
        }
      });
    }

    this.subFields = clone(this.to.customFields);
    for (const customField of this.subFields) {
      customField.hide = customField.key !== this.selectedType;
    }
    this.subModel[this.selectedType] = this.formControl.value;
    this.formControl.valueChanges.pipe(untilDestroyed(this)).subscribe(val => {
      if (this.flag || !this.subForm.value || val === this.subForm.value[this.selectedType]) {
        return;
      }
      this.selectedControl.patchValue(val);
    });

    this.subForm.valueChanges.pipe(untilDestroyed(this)).pipe(debounceTime(200))
      .subscribe(val => {
        if (!this.formControl.value && !val) {
          return;
        }
        if (val && this.formControl.value === val[this.selectedType] || !val[this.selectedType]) {
          return;
        }
        this.flag = true;
        if (!val || !this.subForm.valid) {
          this.formControl.reset();
        } else {
          this.formControl.setValue(val[this.selectedType]);
        }
        this.flag = false;
      });

    if (!this.to.customFieldConfig.selectedTypeChanges) {
      this.to.customFieldConfig.selectedTypeChanges = new EventEmitter<any>();
    }
    this.to.customFieldConfig.selectedTypeChanges.pipe(untilDestroyed(this)).subscribe(([old, newV]) => {
      this.changeActualType(old, newV);
    });
  }

  public changeActualType(old: string, newV: string): void {
    const valToPatch = {};
    valToPatch[newV] = clone(this.subForm.value[old]);
    for (const customField of this.subFields) {
      customField.hide = customField.key !== newV;
    }
    setTimeout(() => {
      this.subForm.patchValue(valToPatch);
    }, 100);
  }
}
