import { Component, OnInit, ViewChild } from '@angular/core';
import queryString from 'query-string';
import { McmsFormParamsWrapperComponent } from '../mcms-form-params-wrapper/mcms-form-params-wrapper.component';

@Component({
  selector: 'mcms-form-query-wrapper-ng',
  templateUrl: './mcms-form-query-wrapper.component.html',
})
export class McmsFormQueryWrapperComponent implements OnInit {
  private fields: string[] = ['openApiConfigUrl', 'schemaName', 'action', 'additionalFields',
    'getUrl', 'submitUrl', 'modelId', 'formInstanceId', 'options'];

  public paramsObj: { [key: string]: string } = {};
  @ViewChild(McmsFormParamsWrapperComponent, {static: false})
  public form: McmsFormParamsWrapperComponent;

  constructor() {
    if (!window.location.search) {
      throw new Error('query not provided');
    }
    const queryObj = queryString.parse(window.location.search);
    for (const field of this.fields) {
      if (queryObj[field] !== undefined) {
        this.paramsObj[field] = JSON.parse(queryObj[field] as string);
      }
    }
    if (this.paramsObj.openApiConfigUrl) {
      (window as any).openApiConfigUrl = this.paramsObj.openApiConfigUrl;
    }
  }


  public async ngOnInit(): Promise<void> {
    this.initResizeEvents();
    window.addEventListener('message', (e) => {
      if (e.data && e.data.submitForm === true) {
        this.form.form.submit();
      }
    });
  }

  public jobDone($event): void {
    window.top.postMessage({type: 'mcms-form-done', senderId: this.paramsObj.formInstanceId, data: $event}, '*');
  }

  public customEvent($event): void {
    $event.senderId = this.paramsObj.formInstanceId;
    window.top.postMessage($event, '*');
  }

  private initResizeEvents(): void {
    new ResizeObserver((entries, observer) => {
      for (const entry of entries) {
        const {height} = entry.contentRect;
        window.top.postMessage({
            height: height + 30,
            type: 'mcms-form-height-changed',
            message: 'I changed my height.',
            senderId: this.paramsObj.formInstanceId,
          }, '*',
        );
      }
    }).observe(document.body);
  }

}
