import { Component, OnInit } from '@angular/core';
import { FieldArrayType } from '@ngx-formly/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mcms-field-array',
  template: `
    <div *ngFor="let subField of field.fieldGroup; let i = index">
      <div class="d-flex align-items-center"
           [ngClass]="field.templateOptions.itemClassName">
        <formly-field [field]="subField" class="flex-grow-1"></formly-field>
        <button class="btn btn-sm btn-danger ml-3"
                type="button"
                (click)="remove(i)"
                *ngIf="canRemove"
                [innerHTML]="customFieldConfig.removeButtonContent || '<i class=\\'fas fa-times\\'></i>'"
        ></button>
      </div>
      <hr *ngIf="!to.hideHr"/>
    </div>
    <div class="d-flex justify-content-end">
      <button class="btn btn-sm btn-primary"
              type="button"
              (click)="add(model?.length || 0)"
              *ngIf="canAdd" [innerHTML]="customFieldConfig.addButtonContent || '<i class=\\'fas fa-plus fa-fw\\'></i>'">
      </button>
    </div>
  `,
})
export class FormlyFieldArrayComponent extends FieldArrayType implements OnInit {

  private lastMinLength: number;

  public get customFieldConfig():
    { removeDisabled?: boolean, addDisabled?: boolean, sortable?: boolean, addButtonContent?: string, removeButtonContent?: string } {
    return this.to.customFieldConfig;
  }

  constructor() {
    super(null);
  }

  public ngOnInit(): void {
    if (!this.to.customFieldConfig) {
      this.to.customFieldConfig = {};
    }
    if (this.lastMinLength !== this.minLength) {
      this.forceAdjustToMinLength();
    }

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(_ => {
      if (this.lastMinLength !== this.minLength) {
        this.forceAdjustToMinLength();
      }
    });
    this.field.fieldArray.fieldGroupClassName = this.field.fieldGroupClassName;
    this.field.fieldArray.className = this.field.className;
    for (const formlyFieldConfig of this.field.fieldGroup) {
      formlyFieldConfig.fieldGroupClassName = this.field.fieldGroupClassName;
      formlyFieldConfig.className = this.field.className;
    }
  }

  private forceAdjustToMinLength(): void {
    if (this.model && this.minLength && this.currentLength < this.minLength) {
      setTimeout(() => {
        while (this.currentLength < this.minLength) {
          this.add(this.currentLength, {});
        }
      });
    }
    this.lastMinLength = this.minLength;
  }

  public remove(i: number): void {
    if (!this.canRemove) {
      return;
    }
    super.remove(i);
  }

  public get isSortable(): boolean {
    return this.field.templateOptions.sortable;
  }

  public get minLength(): number {
    return this.field.templateOptions.minItems;
  }

  public get maxLength(): number {
    return this.field.templateOptions.maxItems;
  }

  public get canRemove(): boolean {
    return !this.customFieldConfig.removeDisabled
      && ((!this.minLength && this.currentLength > 0) || this.minLength && this.currentLength > this.minLength);
  }

  public get canAdd(): boolean {
    return !this.customFieldConfig.addDisabled && (!this.maxLength || this.currentLength < this.maxLength);
  }

  private get currentLength(): number {
    return this.model.length;
  }
}
