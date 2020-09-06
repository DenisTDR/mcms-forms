import { Component } from '@angular/core';
import * as BalloonEditorMcms from '@mcms-cs/ckeditor5-build-balloon';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'app-formly-field-ckeditor',
  templateUrl: './formly-field-ckeditor.component.html',
  styleUrls: ['./formly-field-ckeditor.component.scss'],
})
export class FormlyFieldCkeditorComponent extends FieldType {
  public Editor = BalloonEditorMcms;
  public CKEDITOR_CONFIG = {
    // toolbar: ['bold', 'italic', '|', 'undo', 'redo', '|', 'link', '|', 'NumberedList', 'BulletedList', '|', 'Outdent', 'Indent', '|'],
    // link: {
    //   addTargetToExternalLinks: true,
    // },
  };
}
