import { Component, OnInit, ViewChild } from '@angular/core';
import { merge, Observable, Subject } from 'rxjs';
import { FieldType } from '@ngx-formly/core';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { FormlyHelpersApiService } from '../../services/formly-helpers-api.service';
import OpenApiConfigHelper from '../../services/open-api-config-helper';
import * as areEqual from 'fast-deep-equal';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mcms-field-autocomplete',
  template: `<input
    type="text" class="form-control"
    [formControl]="formControl"
    [ngbTypeahead]="searchFn"
    [inputFormatter]="displayFormatter"
    [resultFormatter]="displayFormatter"
    (focus)="focus$.next($any($event).target.value)"
    (click)="click$.next($any($event).target.value)"
    [editable]='!requiredFromList'
    [formlyAttributes]="field"
    [class.is-invalid]="showError"
    (blur)="onBlur()"
    container="body"
    #instance="ngbTypeahead"
    [resultTemplate]="rt"
  />
  <button class="btn btn-link text-info reload-btn" type="button"
          *ngIf="cc?.showReloadButton"
          [hidden]="forceReloadButtonHidden"
          (click)="forceReloadOptions()"><i class="fas fa-sync"></i></button>
  <ng-template #rt let-result="result" let-term="term" let-formatter="formatter">
    <ng-container *ngIf="result === null">
      <span>No results found</span>
    </ng-container>
    <ngb-highlight *ngIf="result !== null" [result]="formatter(result)" [term]="term"></ngb-highlight>
  </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .reload-btn {
        position: absolute;
        right: 0;
        top: 0;
        opacity: .2;
        transition: opacity .25s;
      }

      :host:hover .reload-btn {
        opacity: .5;
      }

      :host:hover .reload-btn:hover {
        opacity: .8;
      }
    `,
  ],
})
export class FormlyFieldAutocompleteComponent extends FieldType implements OnInit {
  private get getOptions(): any[] {
    return this.to.options as any[];
  }

  public get cc(): any {
    return this.to.customFieldConfig;
  }

  constructor(
    private has: FormlyHelpersApiService,
  ) {
    super();
    this.buildSearchFn();
  }

  private lastSearchModel: string;

  @ViewChild('instance', {static: true}) public instance: NgbTypeahead;
  public searchFn: (text: Observable<string>) => Observable<readonly any[]>;
  public focus$ = new Subject<string>();
  public click$ = new Subject<string>();

  public displayFormatter: (item: any) => string;
  public searchableFormatter: (item: any) => string;

  public maxLength = 25;

  public forceReloadButtonHidden: boolean;

  public get requiredFromList(): boolean {
    return this.to.requiredFromList;
  }

  public ngOnInit(): void {
    // console.log(this.field);
    const labelProp = this.to.labelProp || 'name';
    if (typeof labelProp === 'string') {
      this.displayFormatter = (option: any) => option ? option[labelProp] : '';
    } else {
      this.displayFormatter = labelProp;
    }
    const searchProp = this.to.searchProp || labelProp;
    if (typeof searchProp === 'string') {
      this.searchableFormatter = (option: any) => option[searchProp];
    } else {
      this.searchableFormatter = searchProp;
    }

    if (this.cc?.reloadOptionsOnInit && (!this.cc?.globalVolatileUrl || this.cc?.urlQueryParams)) {
      new OpenApiConfigHelper(this.has).loadOptions(this.field).then();
      this.forceReloadButtonHidden = true;
      setTimeout(() => {
        this.forceReloadButtonHidden = false;
      }, 5000);
    }
    this.observerUrlQueryParams();
    // console.log(this.field.options);
    this.bindToGlobalVolatileUrl();
    // console.log(this.field.key, this.field);
  }

  private buildSearchFn(): void {
    this.searchFn = (text$: Observable<string>) => {
      const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
      const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
      const inputFocus$ = this.focus$;

      return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
        tap(v => {
          this.lastSearchModel = v;
        }),
        map(term => {
            const results = term === '' ? this.getOptions
              : this.getOptions.filter(v => this.searchableFormatter(v).toLowerCase().indexOf(term.toLowerCase()) > -1)
                .slice(0, this.maxLength);
            if (results?.length) {
              return results;
            }
            return [null];
          }
        )
      );
    };
  }

  public onBlur(): void {
    if (this.requiredFromList && this.lastSearchModel && !this.formControl.value) {
      this.formControl.setErrors({'required-from-list': true, ...this.formControl.errors});
    }
  }

  public forceReloadOptions(callback?: () => void): void {
    if (!this.cc.globalVolatileUrl) {
      new OpenApiConfigHelper(this.has).loadOptions(this.field, true).then(() => callback?.call(null));
    } else {
      this.formState.vObj[this.cc.globalVolatileUrl].reload();
    }
  }

  public observerUrlQueryParams(): void {
    if (!this.cc.volatileUrl) {
      return;
    }

    const descr = Object.getOwnPropertyDescriptor(this.cc, 'urlQueryParams');
    if (descr.set) {
      console.error('wtf? just wtf');
      return;
    }
    // keep old value
    this.cc._urlQueryParams = this.cc.urlQueryParams;

    // define getter
    this.cc.__defineGetter__('urlQueryParams', function(): string {
      return this._urlQueryParams;
    });

    // define setter
    const almostThis = this;
    this.cc.__defineSetter__('urlQueryParams', function(value): void {
      if (areEqual(value, this._urlQueryParams)) {
        return;
      }
      this._urlQueryParams = value;
      almostThis.forceReloadOptions(() => {
        almostThis.rehydrateModel();
      });
    });
  }

  public bindToGlobalVolatileUrl(): void {
    if (!this.cc.globalVolatileUrl) {
      return;
    }
    const vObj = this.formState.vObj[this.cc.globalVolatileUrl];
    if (vObj.value) {
      this.to.options = vObj.value;
    }
    vObj.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      this.to.options = value;
      this.rehydrateModel();
    });
  }

  public rehydrateModel(): void {
    if (!this.formControl.value) {
      return;
    }
    const crtValue = this.formControl.value;
    const list: any[] = this.to.options as any[];
    if (!list?.length) {
      return;
    }
    const resultedModel = list.find(o => this.to.compareWith(o, crtValue));
    if (!resultedModel) {
      // console.log('wtfff?');
      return;
    }
    if (!areEqual(crtValue, resultedModel)) {
      this.formControl.setValue(resultedModel);
    }
    this.formControl.updateValueAndValidity();
  }
}
