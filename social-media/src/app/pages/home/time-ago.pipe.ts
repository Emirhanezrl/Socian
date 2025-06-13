import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '';
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (value.seconds) {
      date = new Date(value.seconds * 1000);
    } else {
      date = new Date(value);
    }
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return Math.floor(diff) + ' sn';
    if (diff < 3600) return Math.floor(diff / 60) + ' dk';
    if (diff < 86400) return Math.floor(diff / 3600) + ' s';
    if (diff < 604800) return Math.floor(diff / 86400) + ' g';
    if (diff < 2592000) return Math.floor(diff / 604800) + ' h';
    return date.toLocaleDateString('tr-TR');
  }
} 