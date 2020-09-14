import { Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  template: `
    <div [class]="to.wrapperClasses">
      <ng-template #fieldComponent></ng-template>
    </div>
  `,
})
export class ClassWrapperComponent extends FieldWrapper {
}
