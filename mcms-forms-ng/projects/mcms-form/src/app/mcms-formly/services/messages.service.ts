import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AlertModalComponent } from '../components/alert-modal/alert-modal.component';

@Injectable()
export class MessagesService {

  constructor(
    private modalService: NgbModal
  ) {
  }

  public alert(text: string, title?: string): NgbModalRef {
    const modalRef = this.modalService.open(AlertModalComponent, {centered: true});
    modalRef.componentInstance.text = text;
    modalRef.componentInstance.title = title;
    return modalRef;
  }
}
