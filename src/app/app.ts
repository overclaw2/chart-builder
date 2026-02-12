import { Component } from '@angular/core';
import { ChartCanvasComponent } from './features/chart-canvas/chart-canvas.component';

@Component({
  selector: 'app-root',
  imports: [ChartCanvasComponent],
  template: '<app-chart-canvas></app-chart-canvas>',
  styles: [],
})
export class App {}
