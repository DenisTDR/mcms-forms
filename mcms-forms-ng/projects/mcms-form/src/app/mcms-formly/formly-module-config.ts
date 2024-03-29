import { FormlyFieldArrayComponent } from './fields/formly-field-array/formly-field-array.component';
import { ConfigOption } from '@ngx-formly/core';
import { CardWrapperComponent } from './wrappers/card-wrapper/card-wrapper.component';
import { FormlyFieldTextareaComponent } from './fields/formly-field-textarea/formly-field-textarea.component';
import { FormlyFieldDateComponent } from './fields/formly-field-date/formly-field-date.component';
import { FormlyFieldFileComponent } from './fields/formly-field-file/formly-field-file.component';
import { FormlyFieldCkeditorComponent } from './fields/formly-field-ckeditor/formly-field-ckeditor.component';
import { FormlyFieldTimeComponent } from './fields/formly-field-time/formly-field-time.component';
import { FormlyFieldDateTimeComponent } from './fields/formly-field-date-time/formly-field-date-time.component';
import { FormlyFieldAutocompleteComponent } from './fields/formly-field-autocomplete/formly-field-autocomplete.component';
import { ClassWrapperComponent } from './wrappers/class-wrapper/class-wrapper.component';
import { expressionValidator } from './validators/expression-validator';
import { FormlyFieldCustomNumberComponent } from './fields/formly-field-custom-number/formly-field-custom-number.component';
import { FormlyTextComponent } from './fields/formly-text/formly-text.component';
import requiredFromListValidator from './validators/required-from-list-validator';
import { AccordionWrapperComponent } from './wrappers/accordion-wrapper/accordion-wrapper.component';
import { FormlyButtonComponent } from './fields/formly-button/formly-button.component';
import { FormlyFieldChecklistComponent } from './fields/formly-field-checklist/formly-field-checklist.component';

export const formlyModuleConfig: ConfigOption = {
  types: [
    {
      name: 'array',
      component: FormlyFieldArrayComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'textarea',
      component: FormlyFieldTextareaComponent,
    },
    {
      name: 'date',
      component: FormlyFieldDateComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'time',
      component: FormlyFieldTimeComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'date-time',
      component: FormlyFieldDateTimeComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'file',
      component: FormlyFieldFileComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'ckeditor',
      component: FormlyFieldCkeditorComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'autocomplete',
      component: FormlyFieldAutocompleteComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'custom-number',
      component: FormlyFieldCustomNumberComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'text',
      component: FormlyTextComponent,
    },
    {
      name: 'button',
      component: FormlyButtonComponent,
      wrappers: [],
    },
    {
      name: 'checklist',
      component: FormlyFieldChecklistComponent,
      wrappers: ['form-field'],
    },
    // {
    //   name: 'dynamic',
    //   component: FormlyFieldDynamicComponent,
    // },
  ],
  wrappers: [
    {
      name: 'card',
      component: CardWrapperComponent,
    },
    {
      name: 'class-wrapper',
      component: ClassWrapperComponent,
    },
    // {
    //   name: 'dynamic-type-card',
    //   component: DynamicTypeCardWrapperComponent,
    // },
    {
      name: 'accordion',
      component: AccordionWrapperComponent,
    },
    // {
    //   name: 'dynamic-type-accordion',
    //   component: DynamicTypeAccordionWrapperComponent,
    // },
  ],
  validators: [
    {
      name: 'expression-validator',
      validation: expressionValidator,
    },
    {
      name: 'required-from-list',
      validation: requiredFromListValidator,
    },
  ],
  // those messages will be set from open api config
  // validationMessages: [],
};

