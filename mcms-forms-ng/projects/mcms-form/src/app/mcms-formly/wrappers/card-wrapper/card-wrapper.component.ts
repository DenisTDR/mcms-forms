import { Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  template: `
    <div class="card">
      <h3 class="card-header" *ngIf="to.label">{{ to.label }}</h3>
      <div class="card-body py-3 px-3">
        <ng-template #fieldComponent></ng-template>
      </div>
    </div>
  `,
})
export class CardWrapperComponent extends FieldWrapper {
}
