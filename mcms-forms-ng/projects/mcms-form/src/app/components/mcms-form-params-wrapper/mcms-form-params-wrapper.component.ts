import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { McmsFormComponent } from '../mcms-form/mcms-form.component';
import { ApiService } from '../../services/api.service';
import { OpenApiConfigService } from '../../mcms-formly/services/open-api-config.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'mcms-form-params-wrapper-ng',
  templateUrl: './mcms-form-params-wrapper.component.html',
})
export class McmsFormParamsWrapperComponent implements OnInit {
  public isDebug: boolean;
  public configShown: boolean;

  @Output()
  public done: EventEmitter<any> = new EventEmitter<any>();

  @Input() public schemaName: string;
  @Input() public modelId: string;
  @Input() public action: string;
  @Input() public getUrl: string;
  @Input() public submitUrl: string;
  @Input() public additionalFields: string;
  @Input() public formInstanceId: string;
  @Input() public options: string;

  @ViewChild(McmsFormComponent, {static: false})
  public form: McmsFormComponent;

  public additionalFieldsParsed: any;
  public optionsParsed: any;

  public loaded: boolean;

  constructor(
    private openApiConfigService: OpenApiConfigService,
    private api: ApiService,
  ) {

    this.isDebug = window.location.href.indexOf('debug=true') !== -1 || !environment.production;
  }

  public ngOnInit(): void {
    if (typeof this.options === 'string' && this.options[0] === '{') {
      try {
        this.optionsParsed = JSON.parse(this.options);
      } catch (e) {
      }
    }

    const openApiConfigUrl = (this.optionsParsed && this.optionsParsed.openApiConfigUrl) || (window as any).openApiConfigUrl;
    if (!openApiConfigUrl) {
      throw new Error('\'openApiConfigUrl\' should be passed via \'options\' or should be set as a \'window\' property.');
    }
    this.openApiConfigService.setEndpointUrl(openApiConfigUrl);
    this.api.submitUrl = this.submitUrl;
    this.api.getUrl = this.getUrl;
    this.additionalFieldsParsed = {};
    if (this.additionalFields && this.additionalFields[0] === '{') {
      try {
        this.additionalFieldsParsed = JSON.parse(this.additionalFields);
      } catch (e) {
      }
    }

    this.loaded = true;
  }

  public onDone($event: any): void {
    this.done.emit({params: $event, senderId: this.formInstanceId});
  }

  public toggleConfig(): void {
    this.configShown = !this.configShown;
  }

  public get debugObj(): any {
    return {
      schemaName: this.schemaName,
      modelId: this.modelId,
      action: this.action,
      getUrl: this.getUrl,
      additionalFields: this.additionalFieldsParsed,
      submitUrl: this.submitUrl,
      formInstanceId: this.formInstanceId,
      options: this.optionsParsed,
    };
  }
}
