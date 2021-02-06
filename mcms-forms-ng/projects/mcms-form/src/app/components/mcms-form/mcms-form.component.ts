import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyFormManager } from '../../mcms-formly/formly-form-manager';
import { McmsFormState } from './mcms-form-state';
import clone from 'clone';
import { OpenApiToFormlyService } from '../../mcms-formly/services/open-api-to-formly.service';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import scrollIntoView from 'scroll-into-view-if-needed';

@UntilDestroy()
@Component({
  selector: 'mcms-form',
  templateUrl: './mcms-form.component.html',
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      flex-direction: column;
    }
  `],
})
export class McmsFormComponent implements OnInit, AfterViewInit, OnChanges {

  @Output()
  public done: EventEmitter<any> = new EventEmitter<any>();

  @Input() public schemaName: string;
  @Input() public action: string;
  @Input() public additionalFields: any;
  @Input() public options: any;

  @ViewChild('spinnerContainer', {read: ElementRef})
  public spinnerContainer: ElementRef;


  public formOptions: FormlyFormOptions;

  public isDebug: boolean;
  public state: McmsFormState;

  public form: FormGroup = new FormGroup({});
  public model = {};
  public fields: FormlyFieldConfig[];

  public fieldsClone: FormlyFieldConfig[];

  public viewInit: boolean;

  private formManager: FormlyFormManager;

  public get isPatch(): boolean {
    return this.action === 'patch';
  }

  constructor(
    private openApiToFormlyService: OpenApiToFormlyService,
    private api: ApiService,
  ) {
    this.formManager = new FormlyFormManager(this, openApiToFormlyService, api);
    this.formManager.stateChanged.pipe(untilDestroyed(this)).subscribe(state => {
      this.state = state;
      if (state === 'saving') {
        scrollIntoView(this.spinnerContainer?.nativeElement, {behavior: 'smooth'});
      }
    });

    this.isDebug = window.location.href.indexOf('debug=true') !== -1 || !environment.production;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this.buildFormOptions();
    }
  }

  private buildFormOptions(): void {
    if (!this.formOptions) {
      this.formOptions = {};
    }
    this.formOptions.formState = Object.assign({},
      this.formOptions.formState, {parentModel: this.model}, this.options && this.options.formState);
  }

  public ngOnInit(): void {
    this.load().then();
  }

  public clearCache(): void {
    this.openApiToFormlyService.clearCache();
  }

  public async load(): Promise<void> {
    this.fields = null;
    const loadedData = await this.formManager.load(this.options.basePath);
    this.fields = loadedData.fields;
    this.model = clone(loadedData.model);
    if (this.isDebug) {
      this.fieldsClone = clone(this.fields);
      // console.log(this.fieldsClone);
    }
    if (this.additionalFields) {
      Object.assign(this.model, this.additionalFields);
    }
    this.buildFormOptions();
  }

  public async reloadPage(): Promise<void> {
    window.location.reload();
  }

  public async submit(): Promise<void> {
    if (this.state !== 'ready') {
      alert('Form not submittable!');
      return;
    }
    try {
      if (this.options?.skipApiRequest) {
        this.done.emit({model: this.model});
      } else {
        const result = await this.formManager.submit(this.model);
        if (result) {
          if (result.model) {
            this.model = result.model;
          } else if (!result.skipEmitDone) {
            this.done.emit(result);
          }
        }
      }
    } catch (e) {
      console.error(e);
      let msg = 'An error occurred, check de dev (browser) web console.';
      if (e?.error?.error) {
        msg = e.error.error;
      }
      alert(msg);
      this.formManager.state = 'ready';
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.viewInit = true;
    });
  }

}
