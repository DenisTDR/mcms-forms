import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import safeEvalFormlyExpression from '../../services/safe-eval-formly-expression';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-formly-button',
  template: `
    <label *ngIf="to.fakeLabel" class="d-block">&nbsp;</label>
    <button type="button" [ngClass]="to.buttonClasses" [innerHTML]="to.label" (click)="click()" [disabled]="to.disabled"></button>
  `,
})
export class FormlyButtonComponent extends FieldType {
  public click(): void {
    if (this.to.actionTarget && this.to.actionExpression) {
      const value = safeEvalFormlyExpression(this.to.actionExpression, this.field);
      const control = (this.field.parent.formControl as FormGroup).controls[this.to.actionTarget];
      control.patchValue(value);
      control.markAsTouched();
    } else if (this.to.actionExpression) {
      safeEvalFormlyExpression(this.to.actionExpression, this.field);
    }
  }
}
