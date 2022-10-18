import { EventEmitter } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { NgxFileDropEntry } from 'ngx-file-drop';

export interface FormlyFileFieldConfig {
  uploadUrl: string;
  deleteUrl: string;
  purpose: string;
  multiple: boolean;
  accept: string;
  acceptArr: string[];
  uploadTrigger: EventEmitter<any>;
  stateChanged: Observable<any>;
  state: FormlyFileFieldState;
  isValid: boolean;
}

export interface ProcessedFile {
  droppedFile?: NgxFileDropEntry;
  systemFile?: File;
  backendFile?: { id: string, ownerToken: string, link?: string };
  state: FormlyFileFieldState;
  progress?: number;
  uploadSubscription?: Subscription;
  name?: string;
  errorReason?: string;
}

export type FormlyFileFieldState = 'empty' | 'added' | 'uploading' | 'uploaded' | 'error';
