import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerVisualizationComponent } from './features/container-visualization/container-visualization.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { GatewayHealthService } from './core/services/gateway-health.service';
import { DarkModeService } from './core/services/dark-mode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ContainerVisualizationComponent, SplashScreenComponent],
  template: `
    <div class="app-wrapper">
      <header class="app-header">
        <h1>Container Visualization Platform</h1>
        <div class="header-controls">
          <button 
            class="dark-mode-toggle" 
            (click)="toggleDarkMode()"
            [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            title="Toggle dark mode">
            <span class="toggle-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
          </button>
        </div>
      </header>
      <main class="app-content">
        <app-splash-screen 
          [duration]="3000" 
          (splashComplete)="onSplashComplete()">
        </app-splash-screen>
        <app-container-visualization *ngIf="appReady"></app-container-visualization>
      </main>
    </div>
  `,
  styles: [`
    .app-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .app-header {
      background-color: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .app-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .dark-mode-toggle {
      background: none;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      color: var(--text-primary);
    }

    .dark-mode-toggle:hover {
      background-color: var(--hover-bg);
      border-color: var(--text-primary);
      transform: scale(1.05);
    }

    .dark-mode-toggle:active {
      transform: scale(0.95);
    }

    .toggle-icon {
      display: inline-block;
      transition: transform 0.3s ease;
    }

    .app-content {
      flex: 1;
      overflow: auto;
      background-color: var(--bg-primary);
    }
  `],
})
export class AppComponent implements OnInit {
  appReady = false;
  isDarkMode = false;

  constructor(
    private gatewayHealthService: GatewayHealthService,
    private darkModeService: DarkModeService
  ) {
    this.isDarkMode = this.darkModeService.isDarkMode();
    this.darkModeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  ngOnInit(): void {
    // Gateway health monitoring will start automatically
    console.log('App initialized - Gateway health monitoring active');
  }

  onSplashComplete(): void {
    this.appReady = true;
  }

  toggleDarkMode(): void {
    this.darkModeService.toggleDarkMode();
  }
}
