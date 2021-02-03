import { BrowserModule } from '@angular/platform-browser';
import { ApplicationRef, DoBootstrap, Injector, NgModule } from '@angular/core';

import { McmsFormComponent } from './components/mcms-form/mcms-form.component';
import { McmsFormParamsWrapperComponent } from './components/mcms-form-params-wrapper/mcms-form-params-wrapper.component';
import { McmsFormQueryWrapperComponent } from './components/mcms-form-query-wrapper/mcms-form-query-wrapper.component';
import { environment } from '../environments/environment';
import { createCustomElement } from '@angular/elements';
import { McmsFormlyModule } from './mcms-formly/mcms-formly.module';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from './services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { McmsFormDebugComponent } from './components/mcms-form-debug/mcms-form-debug.component';

@NgModule({
  declarations: [
    McmsFormComponent,
    McmsFormParamsWrapperComponent,
    McmsFormQueryWrapperComponent,
    McmsFormDebugComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    McmsFormlyModule.forRoot(),
    ReactiveFormsModule,
  ],
  providers: [
    ApiService,
  ],
  bootstrap: [],
  exports: [
    McmsFormQueryWrapperComponent,
  ],
})
export class McmsFormModule implements DoBootstrap {

  constructor(private injector: Injector) {
  }

  public ngDoBootstrap(appRef: ApplicationRef): void {
    if (environment.production) {
      const wc = createCustomElement(McmsFormParamsWrapperComponent, {injector: this.injector});
      customElements.define('mcms-form-params-wrapper', wc);
    }
  }
}
