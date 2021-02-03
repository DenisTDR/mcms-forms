import { Component } from '@angular/core';
import { CardWrapperComponent } from '../card-wrapper/card-wrapper.component';

@Component({
  selector: 'mcms-dynamic-type-card',
  template: `
    <mcms-card-wrapper [field]="field">
      <ng-container headerRight>
        <mcms-dynamic-type-switcher [to]="to"></mcms-dynamic-type-switcher>
      </ng-container>
      <ng-container fieldComponent>
        <ng-template #fieldComponent></ng-template>
      </ng-container>
    </mcms-card-wrapper>
  `,
  styles: [],
})
export class DynamicTypeCardWrapperComponent extends CardWrapperComponent {
}
