import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { McmsFormModule } from '../../projects/mcms-form/src/app/mcms-form.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    McmsFormModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
}
