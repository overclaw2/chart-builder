import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerVisualizationComponent } from './features/container-visualization/container-visualization.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { GatewayHealthService } from './core/services/gateway-health.service';

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
export class AppComponent implements OnInit {
  appReady = false;

  constructor(private gatewayHealthService: GatewayHealthService) {}

  ngOnInit(): void {
    // Gateway health monitoring will start automatically
    console.log('App initialized - Gateway health monitoring active');
  }

  onSplashComplete(): void {
    this.appReady = true;
  }
}
