import { Observable, Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { OpenApiToFormlyService } from './services/open-api-to-formly.service';
import { ApiService } from '../services/api.service';
import { compare } from 'fast-json-patch';
import clone from 'clone';
import { FormlyFileFieldConfig, FormlyFileFieldState } from './fields/formly-field-file/formly-file-field-models';
import { HttpResponse } from '@angular/common/http';
import { ModelResponse } from './models/model-response';
import { McmsFormState } from '../components/mcms-form/mcms-form-state';
import { McmsFormComponent } from '../components/mcms-form/mcms-form.component';

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
  ) {
  }

  public initialModel = {};
  private stateValue: McmsFormState = 'ready';

  private stateChangedSubject: Subject<McmsFormState> = new Subject<McmsFormState>();

  public async load(basePath?: string): Promise<{ model: any, fields: FormlyFieldConfig[] }> {
    this.state = 'form-loading';
    this.openApiToFormlyService.basePath = basePath;
    const fields = await this.openApiToFormlyService.getConfig(this.component.schemaName);
    const model = await this.api.get();
    this.initialModel = clone(model);
    this.state = 'ready';
    return {model, fields};
  }

  public async submit(model: any): Promise<{ model: any }> {
    if (this.state !== 'ready') {
      alert('Form not submittable!');
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
      alert('form not valid. please check the fields');
      return;
    }

    // if (this.form.valid) {
    //   console.log('is valid?');
    //   return;
    // }

    this.state = 'saving';
    try {
      let apiResult: HttpResponse<ModelResponse>;
      if (!this.isPatch) {
        apiResult = await this.api.create<ModelResponse>(model);
      } else {
        const patchDoc = compare(this.initialModel, model);
        if (!patchDoc.length) {
          alert('Nothing to save...');
          this.state = 'ready';
          return;
        } else {
          apiResult = await this.api.patch<ModelResponse>(patchDoc);
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

    return new Promise((resolve, reject) => {


      for (const fileFieldConfig of pendingFileFieldsConfigs) {
        fileFieldConfig.stateChanged.subscribe(state => {
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
  }  // tslint:disable-next-line:member-ordering
  private static fileConfig(fileField: FormlyFieldConfig): FormlyFileFieldConfig {
    return fileField.templateOptions.customFieldConfig;
  }
}
