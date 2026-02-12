import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerVisualizationComponent } from './features/container-visualization/container-visualization.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ContainerVisualizationComponent],
  template: `<app-container-visualization></app-container-visualization>`,
  styles: [],
})
export class AppComponent {}
