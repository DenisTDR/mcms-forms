import { Component, OnInit, ViewChild } from '@angular/core';
import * as BalloonEditorMcms from '@mcms-cs/ckeditor5-build-balloon';
import { FieldType } from '@ngx-formly/core';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';

@Component({
  selector: 'mcms-field-ckeditor',
  templateUrl: './formly-field-ckeditor.component.html',
  styleUrls: ['./formly-field-ckeditor.component.scss'],
})
export class FormlyFieldCkeditorComponent extends FieldType implements OnInit {
  public Editor = BalloonEditorMcms;
  public CKEDITOR_CONFIG = {
    // toolbar: ['bold', 'italic', '|', 'undo', 'redo', '|', 'link', '|', 'NumberedList', 'BulletedList', '|', 'Outdent', 'Indent', '|'],
    // link: {
    //   addTargetToExternalLinks: true,
    // },
    simpleUpload: {
      uploadUrl: '/api/FilesUpload/UploadCkEditor',
    },
  };

  @ViewChild(CKEditorComponent)
  public ckeditor!: CKEditorComponent;

  public ngOnInit(): void {
    this.CKEDITOR_CONFIG.simpleUpload.uploadUrl = this.to?.customFieldConfig?.imageUploadUrl || this.CKEDITOR_CONFIG.simpleUpload.uploadUrl;
  }

  public ckeditorReady(editor: any): void {
    // https://github.com/ckeditor/ckeditor5/issues/727#issuecomment-352477990
    const bodyCollection = editor.ui.view.body._parentElement.parentElement;
    const closestModal = editor.ui.view.editable.element.closest('.modal');
    if (closestModal) {
      closestModal.append(bodyCollection);
    }
  }
}
