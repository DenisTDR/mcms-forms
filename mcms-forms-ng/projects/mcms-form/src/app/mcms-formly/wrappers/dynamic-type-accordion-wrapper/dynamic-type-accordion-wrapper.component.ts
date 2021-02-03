import { Component, OnInit } from '@angular/core';
import { CardWrapperComponent } from '../card-wrapper/card-wrapper.component';

@Component({
  selector: 'mcms-dynamic-type-accordion-wrapper',
  template: `
    <mcms-accordion-wrapper [field]="field">
      <ng-container headerRight>
        <mcms-dynamic-type-switcher [to]="to" [hidden]="to.shouldSetNull"></mcms-dynamic-type-switcher>
      </ng-container>
      <ng-container fieldComponent>
        <ng-template #fieldComponent></ng-template>
      </ng-container>
    </mcms-accordion-wrapper>
  `,
})
export class DynamicTypeAccordionWrapperComponent extends CardWrapperComponent {
}
