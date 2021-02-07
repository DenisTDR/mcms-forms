import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-alert-modal',
  template: `
    <div class="modal-header">
      <h4 class="modal-title" [innerHTML]="title"></h4>
      <button type="button" class="close" aria-label="Close" (click)="modal.dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body" [innerHTML]="text"></div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-dark" ngbAutofocus (click)="modal.close()">Close</button>
    </div>
  `,
})
export class AlertModalComponent {
  @Input()
  public text: string;
  @Input()
  public title: string;

  constructor(
    public modal: NgbActiveModal) {
  }
}
