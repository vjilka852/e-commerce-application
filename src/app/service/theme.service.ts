import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'ecommerce_theme';
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly darkModeState = signal(false);

  readonly isDark = this.darkModeState.asReadonly();

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const storedTheme = localStorage.getItem(this.storageKey) as ThemeMode | null;
    this.setDarkMode(storedTheme === 'dark', false);
  }

  setDarkMode(isDark: boolean, persist = true): void {
    this.darkModeState.set(isDark);
    this.document.documentElement.classList.toggle('app-dark', isDark);

    if (persist && this.isBrowser) {
      try {
        localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('Unable to save the selected color theme.', error);
      }
    }
  }
}
