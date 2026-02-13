import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private darkModeSubject = new BehaviorSubject<boolean>(this.getInitialDarkMode());
  public darkMode$: Observable<boolean> = this.darkModeSubject.asObservable();

  constructor() {
    this.applyDarkMode(this.darkModeSubject.value);
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
    this.applyDarkMode(isDark);
  }

  /**
   * Get current dark mode state
   */
  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  /**
   * Apply dark mode to document
   */
  private applyDarkMode(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}
