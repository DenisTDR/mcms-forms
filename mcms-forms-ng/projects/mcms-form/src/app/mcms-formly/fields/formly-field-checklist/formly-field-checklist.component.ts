import { Component, OnInit } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-formly-field-checklist',
  template: `
    <ng-container *ngIf="checkListOptions">
      <div [ngClass]="to.customFieldConfig?.optionClass || 'my-2'" *ngFor="let opt of checkListOptions">
        <div class="custom-control custom-switch" (click)="input.click();">
          <input class="custom-control-input"
                 type="checkbox"
                 #input
                 [checked]="checkedOptions[opt.value]"
                 (click)="$event.stopPropagation()"
                 (change)="toggleOption(opt.value)"
          >
          <label class="custom-control-label">
            {{opt.label}}
          </label>
        </div>
      </div>
    </ng-container>
    <div>
      <pre>{{checkedOptions | json}}</pre>
    </div>
  `,
})
export class FormlyFieldChecklistComponent extends FieldType implements OnInit {

  public checkedOptions: Record<string, boolean> = {};

  public get checkListOptions(): { value: string, label: string }[] {
    return this.to.options as { value: string, label: string }[];
  }

  public ngOnInit(): void {
    this.formControlValueChanged();
    this.formControl.valueChanges.pipe(untilDestroyed(this))
      .subscribe(value => {
        this.formControlValueChanged();
      });
  }

  public toggleOption(value: string): void {
    this.checkedOptions[value] = !this.checkedOptions[value];
    this.formControl.setValue(this.flattenValues());
  }

  private formControlValueChanged(): void {
    if (this.arraysEqual(this.flattenValues(), this.formControl.value)) {
      return;
    }
    this.checkedOptions = {};
    if (Array.isArray(this.formControl.value)) {
      for (const key of this.formControl.value) {
        this.checkedOptions[key] = true;
      }
    }
  }

  private flattenValues(): string[] {
    if (!this.checkedOptions) {
      return [];
    }
    return Object.keys(this.checkedOptions).filter(key => this.checkedOptions[key]);
  }

  private arraysEqual(arr1: any[], arr2: any[]): boolean {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
      return false;
    }
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }

    return true;
  }
}
