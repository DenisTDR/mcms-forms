import { Component, HostBinding, OnInit } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'mcms-class-wrapper',
  template: `
    <ng-template #fieldComponent></ng-template>
  `,
})
export class ClassWrapperComponent extends FieldWrapper implements OnInit {
  @HostBinding('class') public classNames;

  public ngOnInit(): void {
    this.classNames = this.to.wrapperClasses;
  }
}
