import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormlyTemplateOptions } from '@ngx-formly/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mcms-dynamic-type-switcher',
  template: `
    <div class="btn-group btn-group-toggle">
      <ng-container *ngFor="let type of to.customFieldConfig.fieldTypes">
        <div class="switcher-link nav-link" [class.active]="type.type === to.customFieldConfig.selectedType"
             (click)="changeActualType(type.type)">{{type.label}}</div>
      </ng-container>
    </div>
  `,
  styles: [`
    .switcher-link {
      cursor: pointer;
    }

    .switcher-link.active {
      text-decoration: underline;
    }
  `],
})
export class DynamicTypeSwitcherComponent implements OnInit {

  @Input()
  public to: FormlyTemplateOptions;

  public ngOnInit(): void {
    if (!this.to.customFieldConfig.selectedTypeChanges) {
      this.to.customFieldConfig.selectedTypeChanges = new EventEmitter<any>();
    }

    this.to.customFieldConfig.selectedTypeChanges.pipe(untilDestroyed(true)).subscribe(([old, newV]) => {
      this.to.customFieldConfig.selectedType = newV;
    });
  }

  public changeActualType(type: string): void {
    if (this.to.customFieldConfig.selectedType === type) {
      return;
    }
    this.to.customFieldConfig.selectedTypeChanges.emit([this.to.customFieldConfig.selectedType, type]);
  }
}
