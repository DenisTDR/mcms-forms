import { Component, OnInit, ViewChild } from '@angular/core';
import { merge, Observable, Subject } from 'rxjs';
import { FieldType } from '@ngx-formly/core';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-formly-field-autocomplete',
  template: `<input
    type="text" class="form-control"
    [formControl]="formControl"
    [ngbTypeahead]="searchFn"
    [inputFormatter]="displayFormatter"
    [resultFormatter]="displayFormatter"
    (focus)="focus$.next($any($event).target.value)"
    (click)="click$.next($any($event).target.value)"
    [editable]='false'
    [formlyAttributes]="field"
    [class.is-invalid]="showError"
    container="body"
    #instance="ngbTypeahead"/>
  `,
})
export class FormlyFieldAutocompleteComponent extends FieldType implements OnInit {
  private get getOptions(): any[] {
    return this.to.options as any[];
  }

  constructor() {
    super();
    this.buildSearchFn();
  }

  @ViewChild('instance', {static: true}) public instance: NgbTypeahead;
  public searchFn: (text: Observable<string>) => Observable<readonly any[]>;
  public focus$ = new Subject<string>();
  public click$ = new Subject<string>();

  public displayFormatter: (item: any) => string;
  public searchableFormatter: (item: any) => string;

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
  }

  private buildSearchFn(): void {
    this.searchFn = (text$: Observable<string>) => {
      const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
      const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
      const inputFocus$ = this.focus$;

      return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
        map(term => (term === '' ? this.getOptions
          : this.getOptions.filter(v => this.searchableFormatter(v).toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 25))
      );
    };
  }
}
