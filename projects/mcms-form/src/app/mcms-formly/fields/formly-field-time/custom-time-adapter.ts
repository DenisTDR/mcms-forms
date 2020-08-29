import { Injectable } from '@angular/core';
import { NgbTimeAdapter, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';

const pad = (i: number): string => i < 10 ? `0${i}` : `${i}`;

@Injectable()
export class CustomTimeAdapter extends NgbTimeAdapter<string> {

  public fromModel(value: string | null): NgbTimeStruct | null {
    if (!value) {
      return null;
    }
    if (value === '{now}') {
      const now = new Date();
      return {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
      };
    }
    const split = value.split(':');
    return {
      hour: parseInt(split[0], 10),
      minute: parseInt(split[1], 10),
      second: parseInt(split[2], 10),
    };
  }

  public toModel(time: NgbTimeStruct | null): string | null {
    return time != null ? `${pad(time.hour)}:${pad(time.minute)}:${pad(time.second)}` : null;
  }

  public placeholderProject(value: string): string {
    if (value === '{now}') {
      return this.toModel(this.fromModel(value));
    }
    return value;
  }
}
