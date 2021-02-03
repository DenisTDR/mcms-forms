import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';

@UntilDestroy()
@Component({
  selector: 'mcms-accordion-wrapper',
  template: `
    <ngb-accordion #acc="ngbAccordion" [class.has-error]="showError" [activeIds]="[panelId]" class="mb-2 d-block">
      <ngb-panel [id]="panelId">
        <ng-template ngbPanelHeader let-opened="opened">
          <div class="d-flex justify-content-between align-items-center" *ngIf="to.label">
            <div class="d-flex align-items-center">
              <h4 class="mb-0">{{ to.label }}</h4>
            </div>
            <div class="d-flex">
              <div [hidden]="!acc.isExpanded(panelId)" class="d-flex">
                <mcms-wrapper-header-actions [field]="field"></mcms-wrapper-header-actions>
                <ng-content select="[headerRight]"></ng-content>
              </div>
              <button class="btn btn-sm btn-link ml-2" type="button" (click)="toggleExpand()">
                <i class='fas fa-fw' [ngClass]="{'fa-chevron-down': !opened, 'fa-chevron-up': opened}"></i>
              </button>
            </div>
          </div>
        </ng-template>
        <ng-template ngbPanelContent>
          <ng-template #fieldComponent></ng-template>
          <ng-content select="[fieldComponent]"></ng-content>
          <div *ngIf="showError" class="invalid-feedback" [style.display]="'block'">
            <formly-validation-message [field]="field"></formly-validation-message>
          </div>
        </ng-template>
      </ngb-panel>
    </ngb-accordion>
  `,
  styles: [],
})
export class AccordionWrapperComponent extends FieldWrapper implements OnInit {
  public panelId = 'accordion-panel-' + Math.random().toString().split('.')[1];
  @ViewChild('acc')
  private acc: NgbAccordion;

  public ngOnInit(): void {
    if (!this.to.shouldSetNullChange) {
      this.to.shouldSetNullChange = new EventEmitter<void>();
    }
    this.to.shouldSetNullChange.pipe(untilDestroyed(this)).subscribe(_ => {
      if (this.to.shouldSetNull) {
        this.acc.collapseAll();
      } else {
        this.acc.expandAll();
      }
    });
  }

  public toggleExpand(): void {
    const crtIsExpand = this.acc.isExpanded(this.panelId);
    if (this.to.shouldSetNull && !crtIsExpand) {
      this.to.shouldSetNull = false;
      this.to.shouldSetNullChange.emit();
    } else {
      this.acc.toggle(this.panelId);
    }
  }
}
