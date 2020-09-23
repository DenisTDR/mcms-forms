import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 */
@Injectable()
export class CustomDateAdapter extends NgbDateAdapter<string> {

  private readonly DELIMITER = '-';

  public fromModel(value: string | null): NgbDateStruct | null {
    if (value === '{now}') {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      };
    }
    if (value) {
      const date = value.split(this.DELIMITER);
      return {
        year: parseInt(date[0], 10),
        month: parseInt(date[1], 10),
        day: parseInt(date[2], 10),
      };
    }
    return null;
  }

  public toModel(date: NgbDateStruct | null): string | null {
    if (date) {
      const day = (date.day < 10 ? '0' : '') + date.day;
      const month = (date.month < 10 ? '0' : '') + date.month;
      return date.year + this.DELIMITER + month + this.DELIMITER + day;
    }
    return null;
  }

  public placeholderProject(value: string): string {
    if (value === '{now}') {
      return this.toModel(this.fromModel(value));
    }
    return value;
  }
}
