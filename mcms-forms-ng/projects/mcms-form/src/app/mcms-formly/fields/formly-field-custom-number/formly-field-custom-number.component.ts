import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { Subject } from 'rxjs';
import { startWith, takeUntil, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'mcms-field-custom-number',
  template: `
    <input #input
           type="text"
           [formControl]="formControl"
           class="form-control"
           [formlyAttributes]="field"
           [class.is-invalid]="showError"
    />
  `,
})
export class FormlyFieldCustomNumberComponent extends FieldType implements OnInit {

  @ViewChild('input')
  private input: ElementRef<HTMLInputElement>;

  private get nativeElementAvailable(): boolean {
    return !!(this.input && this.input.nativeElement);
  }

  private get nativeElement(): HTMLInputElement {
    return this.input.nativeElement;
  }

  private thousands = ',';
  private decimal = '.';

  private formatNumber(value: string): string {
    let v = value;
    v = v.toString()
      .replace(new RegExp(`[^0-9${this.thousands}${this.decimal}]`, 'g'), '')  // remove invalid chars
      .replace(new RegExp(`\\${this.thousands}`, 'g'), '')  // remove thousands separators
      .replace(new RegExp(`^\\${this.decimal}+`, 'g'), '');  // remove leading decimal separators

    if (!v) {
      return v;
    }

    let decimalPart = '';
    const decimalSeparator = v.indexOf(this.decimal);
    if (decimalSeparator >= 0) {
      // remove all decimal separators after the first one
      decimalPart = this.decimal + v.slice(decimalSeparator).replace(new RegExp(`\\${this.decimal}`, 'g'), '');
      v = v.slice(0, decimalSeparator);
    }
    const asInt = Number.parseInt(v, 10);
    if (isNaN(asInt)) {
      return value;
    }
    v = asInt.toString();
    v = v.replace(/\B(?=(\d{3})+(?!\d))/g, this.thousands) + decimalPart;
    return v;
  }

  private calculateDelta(value: string, newValue: string, pos: number): number {
    const afterCaret = value.slice(pos);
    const deltaTotal = newValue.length - value.length;
    const deltaAfterCaret = this.formatNumber(afterCaret).length - afterCaret.length;
    return deltaTotal - deltaAfterCaret;
  }

  public ngOnInit(): void {
    this.thousands = this.to.thousandsSeparator || this.thousands;
    this.decimal = this.to.decimalSeparator || this.decimal;
    if (this.thousands === this.decimal) {
      throw new Error(`cannot have the same symbol (${this.thousands}) for both thousands and decimal separator!`);
    }

    this.formControl.valueChanges.pipe(
      untilDestroyed(this),
      startWith(this.formControl.value as string),
      tap((value) => {
        if (!value) {
          return value;
        }

        const newValue = this.formatNumber(value);
        let newSelectionStart = 0;
        let newSelectionEnd = 0;

        if (this.nativeElementAvailable && this.nativeElement.selectionStart && this.nativeElement.selectionStart > 0) {
          const el = this.nativeElement;
          const deltaBegin = this.calculateDelta(value, newValue, el.selectionStart);
          let deltaEnd = deltaBegin;
          if (el.selectionEnd > el.selectionStart) {
            deltaEnd = Math.max(deltaBegin, this.calculateDelta(value, newValue, el.selectionEnd));
          }

          newSelectionStart = Math.max(0, el.selectionStart + deltaBegin);
          newSelectionEnd = Math.max(0, el.selectionEnd + deltaEnd);

          if (newSelectionStart > 0) {
            const typedChar = value.charAt(el.selectionStart - 1);
            const newCharBehindCaret = newValue.charAt(newSelectionStart - 1);

            // this is what allows us to backspace over a thousands separator
            if (newCharBehindCaret === this.thousands && typedChar !== this.thousands) {
              newSelectionStart -= 1;
              newSelectionEnd -= 1;
            }
          }

          newSelectionStart = Math.max(0, newSelectionStart);
          newSelectionEnd = Math.max(0, newSelectionEnd);
        }

        this.formControl.patchValue(newValue, {emitEvent: false});
        if (this.nativeElementAvailable) {
          this.nativeElement.setSelectionRange(newSelectionStart, newSelectionEnd);
        }
        return newValue;
      }),
    ).subscribe();
  }
}
