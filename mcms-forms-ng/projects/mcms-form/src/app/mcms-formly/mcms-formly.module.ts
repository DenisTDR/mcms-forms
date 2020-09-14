import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormlyHelpersApiService } from './services/formly-helpers-api.service';
import { OpenApiToFormlyService } from './services/open-api-to-formly.service';
import { OpenApiConfigService } from './services/open-api-config.service';
import { HttpClientModule } from '@angular/common/http';
import { formlyModuleConfig } from './formly-module-config';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';
import { FormlyModule } from '@ngx-formly/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldTextareaComponent } from './fields/formly-field-textarea/formly-field-textarea.component';
import { FormlyFieldAutocompleteComponent } from './fields/formly-field-autocomplete/formly-field-autocomplete.component';
import { FormlyFieldDateTimeComponent } from './fields/formly-field-date-time/formly-field-date-time.component';
import { FormlyFieldTimeComponent } from './fields/formly-field-time/formly-field-time.component';
import { FormlyFieldCkeditorComponent } from './fields/formly-field-ckeditor/formly-field-ckeditor.component';
import { FormlyFieldFileComponent } from './fields/formly-field-file/formly-field-file.component';
import { FormlyFieldDateComponent } from './fields/formly-field-date/formly-field-date.component';
import { CardWrapperComponent } from './wrappers/card-wrapper/card-wrapper.component';
import { FormlyFieldArrayComponent } from './fields/formly-field-array/formly-field-array.component';
import { AutosizeModule } from 'ngx-autosize';
import { NgbDatepickerModule, NgbTimepickerModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxFileDropModule } from 'ngx-file-drop';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ClassWrapperComponent } from './wrappers/class-wrapper/class-wrapper.component';

@NgModule({
  declarations: [
    FormlyFieldArrayComponent,
    FormlyFieldTextareaComponent,
    FormlyFieldDateComponent,
    FormlyFieldFileComponent,
    FormlyFieldCkeditorComponent,
    FormlyFieldTimeComponent,
    FormlyFieldDateTimeComponent,
    FormlyFieldAutocompleteComponent,
    CardWrapperComponent,
    ClassWrapperComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forRoot(formlyModuleConfig),
    FormlyBootstrapModule,
    AutosizeModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    NgbTypeaheadModule,
    NgxFileDropModule,
    CKEditorModule,
  ],
  providers: [
    OpenApiConfigService,
    OpenApiToFormlyService,
    FormlyHelpersApiService,
  ],
  exports: [
    FormlyModule,
  ],
})
export class McmsFormlyModule {
  public static forRoot(): ModuleWithProviders<McmsFormlyModule> {
    return {
      ngModule: McmsFormlyModule,
      providers: [
        OpenApiConfigService,
        OpenApiToFormlyService,
      ],
    };
  }
}
