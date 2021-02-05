import { Component, OnInit, ViewChild } from '@angular/core';
import { merge, Observable, Subject } from 'rxjs';
import { FieldType } from '@ngx-formly/core';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { FormlyHelpersApiService } from '../../services/formly-helpers-api.service';
import OpenApiConfigHelper from '../../services/open-api-config-helper';

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
    #instance="ngbTypeahead"/>
  <button class="btn btn-link text-info reload-btn" type="button"
          *ngIf="to.customFieldConfig?.showReloadButton"
          [hidden]="forceReloadButtonHidden"
          (click)="forceReloadOptions()"><i class="fas fa-sync"></i></button>
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
    const labelProp = this.to.labelProp || 'name';
    if (typeof labelProp === 'string') {
      this.displayFormatter = (option: any) => option[labelProp];
    } else {
      this.displayFormatter = labelProp;
    }
    const searchProp = this.to.searchProp || labelProp;
    if (typeof searchProp === 'string') {
      this.searchableFormatter = (option: any) => option[searchProp];
    } else {
      this.searchableFormatter = searchProp;
    }

    if (this.to.customFieldConfig?.reloadOptionsOnInit) {
      new OpenApiConfigHelper(this.has).loadOptions(this.field).then();
      this.forceReloadButtonHidden = true;
      setTimeout(() => {
        this.forceReloadButtonHidden = false;
      }, 5000);
    }
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
        map(term => (
          term === '' ? this.getOptions
            : this.getOptions.filter(v => this.searchableFormatter(v).toLowerCase().indexOf(term.toLowerCase()) > -1))
          .slice(0, this.maxLength))
      );
    };
  }

  public onBlur(): void {
    if (this.requiredFromList && this.lastSearchModel && !this.formControl.value) {
      this.formControl.setErrors({'required-from-list': true, ...this.formControl.errors});
    }
  }

  public forceReloadOptions(): void {
    new OpenApiConfigHelper(this.has).loadOptions(this.field, true).then();
    this.forceReloadButtonHidden = true;
    setTimeout(() => {
      this.forceReloadButtonHidden = false;
    }, 5000);
  }
}
