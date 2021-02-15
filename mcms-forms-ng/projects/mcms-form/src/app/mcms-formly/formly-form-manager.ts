import { Observable, Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { OpenApiToFormlyService } from './services/open-api-to-formly.service';
import { ApiService } from '../services/api.service';
import { compare } from 'fast-json-patch';
import clone from 'clone';
import { FormlyFileFieldConfig, FormlyFileFieldState } from './fields/formly-field-file/formly-file-field-models';
import { HttpResponse } from '@angular/common/http';
import { FormSubmitResponse } from './models/form-submit-response';
import { McmsFormState } from '../components/mcms-form/mcms-form-state';
import { McmsFormComponent } from '../components/mcms-form/mcms-form.component';
import { MessagesService } from './services/messages.service';
import * as areEqual from 'fast-deep-equal';

export class FormlyFormManager {
  get state(): McmsFormState {
    return this.stateValue;
  }

  set state(value: McmsFormState) {
    this.stateValue = value;
    this.stateChangedSubject.next(value);
  }

  private get isPatch(): boolean {
    return this.component.action === 'patch';
  }

  public get stateChanged(): Observable<McmsFormState> {
    return this.stateChangedSubject.asObservable();
  }

  private get form(): FormGroup {
    return this.component.form;
  }

  constructor(
    private component: McmsFormComponent,
    private openApiToFormlyService: OpenApiToFormlyService,
    private api: ApiService,
    private messages: MessagesService,
  ) {
  }

  public initialModel = {};
  private stateValue: McmsFormState = 'ready';

  private stateChangedSubject: Subject<McmsFormState> = new Subject<McmsFormState>();

  public async load(basePath?: string): Promise<{ model: any, fields: FormlyFieldConfig[], vObj: any }> {
    this.state = 'form-loading';
    this.openApiToFormlyService.helper.basePath = basePath;
    // console.log('getting fields');
    const fields = await this.openApiToFormlyService.getConfig(this.component.schemaName);
    // console.log('got fields');
    const model = await this.api.get();
    this.initialModel = clone(model);
    const vObj = this.openApiToFormlyService.helper.buildFormStateVolatileObject(fields);
    this.state = 'ready';
    return {model, fields, vObj};
  }

  public async submit(model: any): Promise<FormSubmitResponse> {
    if (this.state !== 'ready') {
      this.messages.alert('You can\'t do this right now.');
      return;
    }
    if (this.hasAnyUploadingFileFields()) {
      // console.log('uploading files, keep calm!');
      return;
    }
    if (this.hasAnyPendingFileFields()) {
      // console.log('has pending file fields');
      this.state = 'saving';
      await this.uploadPendingFileFields();
      this.state = 'ready';
    }
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.messages.alert('There are some invalid fields, please check them.');
      return;
    }

    this.state = 'saving';
    try {
      let apiResult: HttpResponse<FormSubmitResponse>;
      if (!this.isPatch) {
        apiResult = await this.api.create<FormSubmitResponse>(model);
      } else {
        const patchDoc = compare(this.initialModel, model);
        if (!patchDoc.length) {
          this.messages.alert('There is nothing new to save.');
          this.state = 'ready';
          return;
        } else {
          apiResult = await this.api.patch<FormSubmitResponse>(patchDoc);
        }
      }
      if (apiResult.body && apiResult.body.model) {
        this.initialModel = clone(apiResult.body.model);
      }
      this.state = 'ready';
      return apiResult.body;
    } catch (e) {
      this.state = 'error';
      throw e;
    }
  }

  private async uploadPendingFileFields(): Promise<boolean> {
    const fileFields = this.getFileFields(this.component.fields);
    const pendingFileFieldsConfigs = fileFields.filter(fileField => FormlyFormManager.fileConfig(fileField).state === 'added')
      .map(fileField => FormlyFormManager.fileConfig(fileField));
    const allDone = () => {
      return pendingFileFieldsConfigs.every(ffc => ffc.state !== 'uploading');
    };

    return new Promise((resolve) => {
      for (const fileFieldConfig of pendingFileFieldsConfigs) {
        fileFieldConfig.stateChanged.subscribe(_ => {
          if (allDone()) {
            resolve();
          }
        });

        fileFieldConfig.uploadTrigger.emit();
      }
    });
  }

  private hasAnyUploadingFileFields(): boolean {
    return this.getFileFields(this.component.fields).some(fileField => FormlyFormManager.stateOfFileField(fileField) === 'uploading');
  }

  private hasAnyPendingFileFields(): boolean {
    return this.getFileFields(this.component.fields).some(fileField => FormlyFormManager.stateOfFileField(fileField) === 'added');
  }

  private getFileFields(source: FormlyFieldConfig[]): FormlyFieldConfig[] {
    const list = [];
    for (const field of source) {
      if (field.type === 'file') {
        list.push(field);
      } else if (field.type === 'array' || field.type === 'formly-group') {
        list.push(...this.getFileFields(field.fieldGroup));
      }
    }
    return list;
  }


  // tslint:disable-next-line:member-ordering
  private static stateOfFileField(fileField: FormlyFieldConfig): FormlyFileFieldState {
    return (fileField.templateOptions.customFieldConfig as FormlyFileFieldConfig).state;
  }

  // tslint:disable-next-line:member-ordering
  private static fileConfig(fileField: FormlyFieldConfig): FormlyFileFieldConfig {
    return fileField.templateOptions.customFieldConfig;
  }
}
