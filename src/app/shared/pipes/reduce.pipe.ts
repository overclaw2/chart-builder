import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reduce',
  standalone: true,
})
export class ReducePipe implements PipeTransform {
  transform(array: any[], property: string, initialValue: number = 0): number {
    if (!Array.isArray(array)) {
      return initialValue;
    }

    return array.reduce((sum, item) => {
      const value = item[property];
      const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      return sum + numValue;
    }, initialValue);
  }
}
