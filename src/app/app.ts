import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ChartCanvasComponent } from './features/chart-canvas/chart-canvas.component';
import { ChartWrapperComponent } from './shared/components/chart-wrapper/chart-wrapper.component';

@NgModule({
  declarations: [ChartCanvasComponent, ChartWrapperComponent],
  imports: [BrowserModule, CommonModule],
  bootstrap: [ChartCanvasComponent],
})
export class AppModule {}
