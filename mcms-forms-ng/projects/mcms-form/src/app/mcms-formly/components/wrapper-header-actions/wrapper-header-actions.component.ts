import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormlyFieldConfig, FormlyTemplateOptions } from '@ngx-formly/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mcms-wrapper-header-actions',
  template: `
    <ng-container *ngIf="!to.required && to.canBeSetNull">
      <button class="btn btn-secondary"
              type="button"
              (click)="toggleSetNull()">
        <i class="mr-1 far" [class.fa-check-square]="to.shouldSetNull" [class.fa-square]="!to.shouldSetNull" style="font-size: 1.2em;"></i>
        Set null
      </button>
    </ng-container>
    <ng-container *ngIf="to.customFieldConfig?.fieldGroupFill?.enabled">
      <mcms-field-fill-button [field]="field" [hidden]="to.shouldSetNull"></mcms-field-fill-button>
    </ng-container>
  `,
  styles: [`
    :host {
      display: flex;
    }
  `],
})
export class WrapperHeaderActionsComponent implements OnInit {

  public get to(): FormlyTemplateOptions {
    return this.field.templateOptions;
  }

  @Input()
  public field: FormlyFieldConfig;

  public ngOnInit(): void {
    if (!this.to.shouldSetNullChange) {
      this.to.shouldSetNullChange = new EventEmitter<void>();
    }
    this.field.templateOptions.origDisabled = this.field.templateOptions.disabled;
    this.to.shouldSetNullChange.pipe(untilDestroyed(this)).subscribe(_ => {
      this.field.templateOptions.disabled = this.to.shouldSetNull ? true : this.field.templateOptions.origDisabled;
      if (this.to.shouldSetNull) {
        this.field.formControl.reset();
        this.field.parent.model[this.field.key.toString()] = null;
      }
    });
    if (this.to.canBeSetNull) {
      if (!this.field.formControl.value) {
        this.to.shouldSetNull = true;
        setTimeout(() => {
          this.to.shouldSetNullChange.emit();
        });
        return;
      }
      if (this.field.parent && this.field.parent.model[this.field.key + 'Null']) {
        delete this.field.parent.model[this.field.key + 'Null'];
        this.to.shouldSetNull = true;
        setTimeout(() => {
          this.to.shouldSetNullChange.emit();
        });
        return;
      }
    }
  }

  public toggleSetNull(): void {
    this.to.shouldSetNull = !this.to.shouldSetNull;
    this.to.shouldSetNullChange.emit();
  }
}
