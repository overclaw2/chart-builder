import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeType = 'default' | 'high-contrast' | 'colorblind-friendly';
export type ColorMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ColorMode;
  theme: ThemeType;
  brandColor?: string; // Brand color for white-label deployments
}

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private darkModeSubject = new BehaviorSubject<boolean>(this.getInitialDarkMode());
  public darkMode$: Observable<boolean> = this.darkModeSubject.asObservable();

  private themeSubject = new BehaviorSubject<ThemeType>(this.getInitialTheme());
  public theme$: Observable<ThemeType> = this.themeSubject.asObservable();

  private themeConfigSubject = new BehaviorSubject<ThemeConfig>(this.getInitialConfig());
  public themeConfig$: Observable<ThemeConfig> = this.themeConfigSubject.asObservable();

  // Theme color palettes
  private themePalettes = {
    'default': {
      light: {
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#000000',
        textSecondary: '#666666',
        border: '#e0e0e0',
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      dark: {
        background: '#1e1e1e',
        surface: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        border: '#404040',
        primary: '#60a5fa',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171'
      }
    },
    'high-contrast': {
      light: {
        background: '#ffffff',
        surface: '#f0f0f0',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        primary: '#0000ff',
        success: '#008000',
        warning: '#ff8c00',
        error: '#ff0000'
      },
      dark: {
        background: '#000000',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#e0e0e0',
        border: '#ffffff',
        primary: '#ffff00',
        success: '#00ff00',
        warning: '#ffaa00',
        error: '#ff5555'
      }
    },
    'colorblind-friendly': {
      light: {
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#000000',
        textSecondary: '#595959',
        border: '#d1d5db',
        primary: '#0173b2',
        success: '#de8f05',
        warning: '#cc78bc',
        error: '#ca9161'
      },
      dark: {
        background: '#1a1a1a',
        surface: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#c0c0c0',
        border: '#505050',
        primary: '#56b4e9',
        success: '#f8cb9c',
        warning: '#cc77bc',
        error: '#d895d0'
      }
    }
  };

  constructor() {
    this.applyTheme(this.themeConfigSubject.value);
    this.watchSystemThemePreference();
  }

  /**
   * Get initial dark mode state from localStorage or system preference
   */
  private getInitialDarkMode(): boolean {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
    // Detect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Get initial theme from localStorage
   */
  private getInitialTheme(): ThemeType {
    const stored = localStorage.getItem('theme');
    if (stored && ['default', 'high-contrast', 'colorblind-friendly'].includes(stored)) {
      return stored as ThemeType;
    }
    return 'default';
  }

  /**
   * Get initial theme config
   */
  private getInitialConfig(): ThemeConfig {
    const brandColor = localStorage.getItem('brandColor');
    return {
      mode: this.getInitialDarkMode() ? 'dark' : 'light',
      theme: this.getInitialTheme(),
      brandColor: brandColor || undefined
    };
  }

  /**
   * Watch for system theme preference changes
   */
  private watchSystemThemePreference(): void {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
      // Only apply if user hasn't manually set preference
      if (!localStorage.getItem('darkMode')) {
        this.setDarkMode(e.matches);
      }
    });
  }

  /**
   * Toggle dark mode on/off
   */
  toggleDarkMode(): void {
    const newState = !this.darkModeSubject.value;
    this.setDarkMode(newState);
  }

  /**
   * Set dark mode to a specific state
   */
  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    localStorage.setItem('darkMode', String(isDark));
    
    const config = this.themeConfigSubject.value;
    config.mode = isDark ? 'dark' : 'light';
    this.themeConfigSubject.next(config);
    this.applyTheme(config);
  }

  /**
   * Set theme
   */
  setTheme(theme: ThemeType): void {
    this.themeSubject.next(theme);
    localStorage.setItem('theme', theme);
    
    const config = this.themeConfigSubject.value;
    config.theme = theme;
    this.themeConfigSubject.next(config);
    this.applyTheme(config);
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): ThemeType[] {
    return ['default', 'high-contrast', 'colorblind-friendly'];
  }

  /**
   * Set brand color for white-label deployments
   */
  setBrandColor(color: string): void {
    localStorage.setItem('brandColor', color);
    
    const config = this.themeConfigSubject.value;
    config.brandColor = color;
    this.themeConfigSubject.next(config);
    this.applyTheme(config);
  }

  /**
   * Get current dark mode state
   */
  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): ThemeType {
    return this.themeSubject.value;
  }

  /**
   * Get current theme config
   */
  getCurrentThemeConfig(): ThemeConfig {
    return this.themeConfigSubject.value;
  }

  /**
   * Apply theme to document
   */
  private applyTheme(config: ThemeConfig): void {
    const palette = this.themePalettes[config.theme][config.mode];
    
    // Apply CSS variables for theming
    const root = document.documentElement;
    root.style.setProperty('--color-background', palette.background);
    root.style.setProperty('--color-surface', palette.surface);
    root.style.setProperty('--color-text', palette.text);
    root.style.setProperty('--color-text-secondary', palette.textSecondary);
    root.style.setProperty('--color-border', palette.border);
    root.style.setProperty('--color-primary', config.brandColor || palette.primary);
    root.style.setProperty('--color-success', palette.success);
    root.style.setProperty('--color-warning', palette.warning);
    root.style.setProperty('--color-error', palette.error);

    // Apply classes to document
    document.documentElement.classList.toggle('dark-mode', config.mode === 'dark');
    document.documentElement.classList.toggle('light-mode', config.mode === 'light');
    document.documentElement.setAttribute('data-theme', config.theme);
    document.documentElement.setAttribute('data-color-mode', config.mode);
  }

  /**
   * Reset to default theme
   */
  resetTheme(): void {
    localStorage.removeItem('darkMode');
    localStorage.removeItem('theme');
    localStorage.removeItem('brandColor');
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDarkMode(isDark);
    this.setTheme('default');
  }
}
