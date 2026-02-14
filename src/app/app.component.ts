import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerVisualizationComponent } from './features/container-visualization/container-visualization.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { GatewayHealthService } from './core/services/gateway-health.service';
import { DarkModeService, ThemeType } from './core/services/dark-mode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ContainerVisualizationComponent, SplashScreenComponent],
  template: `
    <div class="app-wrapper">
      <header class="app-header">
        <h1>Container Visualization Platform</h1>
        <div class="header-controls">
          <!-- Dark Mode Toggle -->
          <button 
            class="control-btn dark-mode-toggle" 
            (click)="toggleDarkMode()"
            [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            title="Toggle dark mode">
            <span class="toggle-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
          </button>

          <!-- Theme Selector -->
          <div class="theme-selector-wrapper">
            <button 
              class="control-btn theme-selector-btn"
              (click)="toggleThemeMenu()"
              title="Select theme">
              🎨
            </button>
            
            <div class="theme-menu" *ngIf="showThemeMenu">
              <div class="menu-header">
                <h3>Select Theme</h3>
                <button class="close-btn" (click)="toggleThemeMenu()">×</button>
              </div>
              <div class="theme-options">
                <button 
                  *ngFor="let t of availableThemes"
                  class="theme-option"
                  [class.active]="currentTheme === t"
                  (click)="selectTheme(t)">
                  {{ getThemeLabel(t) }}
                </button>
              </div>
              <button class="reset-btn" (click)="resetTheme()">↻ Reset</button>
            </div>
          </div>
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

    .control-btn {
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

    .control-btn:hover {
      background-color: var(--hover-bg);
      border-color: var(--color-primary);
      transform: scale(1.05);
    }

    .control-btn:active {
      transform: scale(0.95);
    }

    .toggle-icon {
      display: inline-block;
      transition: transform 0.3s ease;
    }

    .theme-selector-wrapper {
      position: relative;
    }

    .theme-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      min-width: 200px;
      margin-top: 8px;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .menu-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: var(--text-primary);
    }

    .theme-options {
      padding: 8px;
    }

    .theme-option {
      display: block;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .theme-option:hover {
      background-color: var(--hover-bg);
    }

    .theme-option.active {
      background-color: var(--color-primary);
      color: #ffffff;
      font-weight: 600;
    }

    .reset-btn {
      display: block;
      width: calc(100% - 16px);
      margin: 8px;
      padding: 8px 12px;
      background-color: var(--color-error);
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .reset-btn:hover {
      filter: brightness(0.9);
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
  currentTheme: ThemeType = 'default';
  availableThemes: ThemeType[] = [];
  showThemeMenu = false;

  constructor(
    private gatewayHealthService: GatewayHealthService,
    private darkModeService: DarkModeService
  ) {
    this.isDarkMode = this.darkModeService.isDarkMode();
    this.currentTheme = this.darkModeService.getCurrentTheme();
    this.availableThemes = this.darkModeService.getAvailableThemes();
    
    this.darkModeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    this.darkModeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
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

  toggleThemeMenu(): void {
    this.showThemeMenu = !this.showThemeMenu;
  }

  selectTheme(theme: ThemeType): void {
    this.darkModeService.setTheme(theme);
    this.showThemeMenu = false;
  }

  resetTheme(): void {
    this.darkModeService.resetTheme();
    this.showThemeMenu = false;
  }

  getThemeLabel(theme: ThemeType): string {
    const labels: Record<ThemeType, string> = {
      'default': 'Default',
      'high-contrast': 'High Contrast',
      'colorblind-friendly': 'Colorblind Friendly'
    };
    return labels[theme];
  }
}
