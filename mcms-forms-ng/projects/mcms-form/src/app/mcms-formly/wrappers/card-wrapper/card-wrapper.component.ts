import { Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'mcms-card-wrapper',
  template: `
    <div class="card mb-2" [class.has-error]="showError">
      <div class="card-header d-flex justify-content-between align-items-center" *ngIf="!to.hideHeader">
        <div class="d-flex align-items-center">
          <h4 class="mb-0" *ngIf="to.label">{{ to.label }}</h4>
        </div>
        <div>
          <mcms-wrapper-header-actions [field]="field"></mcms-wrapper-header-actions>
          <ng-content select="[headerRight]"></ng-content>
        </div>
      </div>
      <div class="card-body py-3 px-3" [hidden]="!to.required && to.shouldSetNull">
        <ng-template #fieldComponent></ng-template>
        <ng-content select="[fieldComponent]"></ng-content>
        <div *ngIf="showError" class="invalid-feedback" [style.display]="'block'">
          <formly-validation-message [field]="field"></formly-validation-message>
        </div>
      </div>
    </div>
  `,
})
export class CardWrapperComponent extends FieldWrapper {
}
