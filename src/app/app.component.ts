import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerVisualizationComponent } from './features/container-visualization/container-visualization.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ContainerVisualizationComponent, SplashScreenComponent],
  template: `
    <app-splash-screen 
      [duration]="3000" 
      (splashComplete)="onSplashComplete()">
    </app-splash-screen>
    <app-container-visualization *ngIf="appReady"></app-container-visualization>
  `,
  styles: [],
})
export class AppComponent {
  appReady = false;

  onSplashComplete(): void {
    this.appReady = true;
  }
}
