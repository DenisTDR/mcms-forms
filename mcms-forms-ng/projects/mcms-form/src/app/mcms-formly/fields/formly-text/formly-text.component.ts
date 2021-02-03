import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'mcms-text',
  template: `
    <div *ngIf="to.label" [innerHTML]="to.label" class="title"></div>
    <div *ngIf="to.description" [innerHTML]="to.description"></div>
  `,
  styles: ['.title {font-size: 1.25em; }'],
})
export class FormlyTextComponent extends FieldType {
}
