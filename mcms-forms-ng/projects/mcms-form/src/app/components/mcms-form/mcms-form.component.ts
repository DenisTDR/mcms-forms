import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
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
import { MessagesService } from '../../mcms-formly/services/messages.service';
import { debounceTime } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'mcms-form',
  templateUrl: './mcms-form.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `],
})
export class McmsFormComponent implements OnInit, AfterViewInit, OnChanges {

  @Output()
  public done: EventEmitter<any> = new EventEmitter<any>();
  @Output()
  public customEvent: EventEmitter<{ type: string, data: any }> = new EventEmitter<any>();

  @Input() public schemaName: string;
  @Input() public action: string;
  @Input() public additionalFields: any;
  @Input() public options: {
    spinner: string, hideSubmitButton: boolean,
    basePath: string, skipApiRequest: boolean, formState: any
  };

  public formOptions: FormlyFormOptions;

  public isDebug: boolean;
  public state: McmsFormState;

  public form: FormGroup;
  public model = {};
  public fields: FormlyFieldConfig[];

  public fieldsClone: FormlyFieldConfig[];

  public viewInit: boolean;

  private formManager: FormlyFormManager;

  private vObj: any;

  public get isPatch(): boolean {
    return this.action === 'patch';
  }

  constructor(
    private openApiToFormlyService: OpenApiToFormlyService,
    private api: ApiService,
    private messages: MessagesService,
  ) {
    this.formManager = new FormlyFormManager(this, openApiToFormlyService, api, messages);
    this.formManager.stateChanged.pipe(untilDestroyed(this)).subscribe(state => {
      this.state = state;
      this.customEvent.emit({type: 'state-changed', data: {state}});
    });

    this.isDebug = window.location.href.indexOf('formly-debug=true') !== -1 || !environment.production;

  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      this.buildFormOptions();
    }
  }

  private buildFormOptions(force?: boolean): void {
    if (force || !this.formOptions) {
      this.formOptions = {};
    }
    this.formOptions.formState = Object.assign({},
      this.formOptions.formState, {parentModel: this.model}, this.options && this.options.formState);
    this.formOptions.formState.vObj = this.vObj;
    // console.log(this.formOptions.formState);
  }

  public ngOnInit(): void {
    this.load().then();
  }

  public clearCache(): void {
    this.openApiToFormlyService.clearCache();
  }

  public async load(): Promise<void> {
    // console.log('load()');
    this.form = new FormGroup({});

    this.form.valueChanges.pipe(untilDestroyed(this), debounceTime(500)).subscribe(value => {
      this.customEvent.emit({type: 'form-updated', data: {value, status: this.form.status}});
    });

    this.buildFormOptions(true);
    this.fields = null;
    const loadedData = await this.formManager.load(this.options.basePath);
    this.fields = loadedData.fields;
    this.model = clone(loadedData.model);
    this.vObj = loadedData.vObj;
    if (this.isDebug) {
      this.fieldsClone = clone(this.fields);
    }
    if (this.additionalFields) {
      Object.assign(this.model, this.additionalFields);
    }
    // console.log('put vObj');
    this.buildFormOptions();
    // console.log('load() done');
  }

  public async reloadPage(): Promise<void> {
    window.location.reload();
  }

  public async submit(): Promise<void> {
    if (this.state !== 'ready') {
      this.messages.alert('You can\'t do this right now.');
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
          }
          if (!result.skipEmitDone) {
            this.done.emit(result);
          }
          if (result.snack) {
            this.customEvent.emit({
              type: 'snack',
              data: {text: result.snack, type: result.snackType, duration: result.snackDuration || 4000},
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
      let msg = 'An unknown/fatal error occurred, check the dev (browser) web console for more details.';
      if (e?.error?.error) {
        msg = e.error.error;
      }
      this.messages.alert(msg);
      this.formManager.state = 'ready';
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.viewInit = true;
    });
  }
}
