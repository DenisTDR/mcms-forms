import { Component, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { FormlyFileFieldConfig, FormlyFileFieldState, ProcessedFile } from './formly-file-field-models';
import { Subject } from 'rxjs';
import clone from 'clone';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-formly-field-file',
  templateUrl: './formly-field-file.component.html',
  styleUrls: ['./formly-field-file.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FormlyFieldFileComponent extends FieldType implements OnInit {

  public isFileOver: boolean;
  private stateSubject: Subject<FormlyFileFieldState> = new Subject<FormlyFileFieldState>();

  public get customFieldConfig(): FormlyFileFieldConfig {
    return this.to && this.to.customFieldConfig || {};
  }

  public customFieldConfigClone: FormlyFileFieldConfig;

  private stateValue: FormlyFileFieldState;

  public get state(): FormlyFileFieldState {
    return this.stateValue;
  }

  public set state(value: FormlyFileFieldState) {
    if (this.stateValue === value) {
      return;
    }
    this.stateValue = value;
    this.customFieldConfig.state = value;
    this.customFieldConfig.isValid = value === 'empty' && !this.to.required || value === 'uploaded';
    this.stateSubject.next(value);
  }

  constructor(
    private http: HttpClient,
  ) {
    super();
  }

  public processedFiles: ProcessedFile[] = [];

  public dropped(files: NgxFileDropEntry[]) {
    this.isFileOver = false;

    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        if (!this.hasValidExtension(droppedFile)) {
          alert('Invalid file format! Allowed formats: ' + this.customFieldConfig.accept);
          continue;
        }
        const processedFile: ProcessedFile = {droppedFile, state: 'added', name: droppedFile.relativePath};
        this.processedFiles.push(processedFile);

        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          processedFile.systemFile = file;
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        // so we can ignore it
        // const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        // console.log(droppedFile.relativePath, fileEntry);
      }
    }
    this.updateValueAndState();
  }

  public remove(i: number): void {
    if (!confirm('Are you sure you want to delete this file? This action can\'t be undone.')) {
      return;
    }
    const processedFile = this.processedFiles[i];
    if (processedFile.state === 'uploaded') {
      this.http.delete(this.customFieldConfig.deleteUrl, {
        params: {
          id: processedFile.backendFile.id,
          ownerToken: processedFile.backendFile.ownerToken,
        },
      }).toPromise().then();
    } else if (processedFile.state === 'uploading' && processedFile.uploadSubscription) {
      processedFile.uploadSubscription.unsubscribe();
      this.updateValueAndState();
    }
    this.processedFiles.splice(i, 1);
    this.updateValueAndState();
  }

  public retry(i: number): void {
    if (this.processedFiles[i].state === 'error') {
      this.beginUpload(this.processedFiles[i]);
    }
  }

  public updateValueAndState() {
    this.updateState();
    this.updateValue();
  }

  public updateState() {
    if (this.processedFiles.length === 0) {
      this.state = 'empty';
    } else if (this.processedFiles.some(file => file.state === 'uploading')) {
      this.state = 'uploading';
    } else if (this.processedFiles.some(file => file.state === 'error')) {
      this.state = 'error';
    } else if (this.processedFiles.every(file => file.state === 'uploaded')) {
      this.state = 'uploaded';
    } else {
      this.state = 'added';
    }
    if (this.showError) {
      this.formControl.reset();
    }
  }

  public updateValue() {
    let value;
    // console.log('updateValue with ' + this.state);
    switch (this.state) {
      case 'uploaded':
        const buildValue = this.processedFiles.map(file => file.backendFile);
        if (this.customFieldConfig.multiple) {
          value = buildValue;
        } else {
          value = buildValue[0];
        }
        break;
      default:
        value = undefined;
        break;
    }
    this.formControl.setValue(value);
    if (this.state === 'error') {
      this.formControl.setErrors({error: true});
    }
  }

  public ngOnInit(): void {
    this.customFieldConfigClone = clone(this.customFieldConfig);
    this.state = 'empty';
    this.customFieldConfig.stateChanged = this.stateSubject.asObservable();
    this.customFieldConfig.uploadTrigger = new EventEmitter<any>();
    this.customFieldConfig.uploadTrigger.subscribe(() => {
      this.doUpload().then();
    });
    this.loadInitialValue();
  }

  private loadInitialValue() {
    if (!this.formControl.value) {
      return;
    }
    if (Array.isArray(this.formControl.value)) {
      for (const val of this.formControl.value) {
        this.processedFiles.push({backendFile: val, state: 'uploaded', name: val.originalName});
      }
    } else {
      const val = this.formControl.value;
      this.processedFiles.push({backendFile: val, state: 'uploaded', name: val.originalName});
    }
  }

  public onFileOver(event) {
    this.isFileOver = true;
  }

  public onFileLeave(event) {
    this.isFileOver = false;
  }

  public async doUpload() {
    // console.log('doUpload');

    const filesToUpload = this.processedFiles.filter(file => file.state === 'added');

    for (const fileToUpload of filesToUpload) {
      this.beginUpload(fileToUpload);
    }
    this.updateValueAndState();
  }

  public beginUpload(fileToUpload: ProcessedFile) {
    fileToUpload.state = 'uploading';
    const formData = new FormData();
    formData.append('file', fileToUpload.systemFile, fileToUpload.systemFile.name);

    // Headers
    const headers = new HttpHeaders({
      // 'security-token': 'mytoken'
    });
    fileToUpload.errorReason = null;

    fileToUpload.uploadSubscription = this.http.post<any>(this.customFieldConfig.uploadUrl,
      formData, {
        headers,
        params: {purpose: this.customFieldConfig.purpose},
        reportProgress: true,
        observe: 'events',
      })
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          fileToUpload.progress = Math.round(event.loaded / event.total * 10000) / 100;
        }
        if (event.type === HttpEventType.Response) {
          fileToUpload.backendFile = {id: event.body.id, ownerToken: event.body.ownerToken};
          fileToUpload.state = 'uploaded';
          fileToUpload.uploadSubscription = null;
          this.updateValueAndState();
        }
      }, error => {
        fileToUpload.state = 'error';
        fileToUpload.uploadSubscription = null;
        if (error && error.error && typeof error.error.error === 'string') {
          fileToUpload.errorReason = error.error.error;
        }
        console.log(error);
        this.updateValueAndState();
      });
  }

  private hasValidExtension(file: NgxFileDropEntry): boolean {
    if (!this.customFieldConfig.accept) {
      return true;
    }
    if (!this.customFieldConfig.acceptArr) {
      this.customFieldConfig.acceptArr = this.customFieldConfig.accept.split(',').map(acc => acc.toLowerCase());
    }
    return this.customFieldConfig.acceptArr.some(accExt => file.fileEntry.name.toLowerCase().endsWith(accExt.toLowerCase()));
  }
}
