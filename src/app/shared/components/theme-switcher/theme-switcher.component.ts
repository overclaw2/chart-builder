import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DarkModeService, ThemeType, ColorMode } from '../../../core/services/dark-mode.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.css']
})
export class ThemeSwitcherComponent implements OnInit {
  darkMode$: Observable<boolean>;
  theme$: Observable<ThemeType>;
  availableThemes: ThemeType[] = [];
  showThemeMenu = false;
  showBrandColorInput = false;
  brandColor = '#3b82f6';

  constructor(private darkModeService: DarkModeService) {
    this.darkMode$ = this.darkModeService.darkMode$;
    this.theme$ = this.darkModeService.theme$;
  }

  ngOnInit(): void {
    this.availableThemes = this.darkModeService.getAvailableThemes();
    const config = this.darkModeService.getCurrentThemeConfig();
    if (config.brandColor) {
      this.brandColor = config.brandColor;
    }
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

  toggleBrandColorInput(): void {
    this.showBrandColorInput = !this.showBrandColorInput;
  }

  onBrandColorChange(event: any): void {
    const color = event.target.value;
    this.brandColor = color;
    this.darkModeService.setBrandColor(color);
  }

  resetTheme(): void {
    this.darkModeService.resetTheme();
    this.brandColor = '#3b82f6';
    this.showThemeMenu = false;
    this.showBrandColorInput = false;
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
