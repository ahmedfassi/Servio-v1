import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'servio-theme';
  // SSR renders this service on the Node server too, where there is no
  // localStorage/document/window — every browser-API access below is
  // gated behind this check.
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Current theme. Read this in templates as theme.value() */
  readonly value = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Whenever the theme changes, reflect it on <html data-theme="..."> and persist it.
    // CSS variables in styles.scss key off that attribute.
    effect(() => {
      const current = this.value();
      if (!this.isBrowser) return;
      document.documentElement.setAttribute('data-theme', current);
      localStorage.setItem(this.storageKey, current);
    });
  }

  toggle(): void {
    this.value.set(this.value() === 'dark' ? 'light' : 'dark');
  }

  private getInitialTheme(): Theme {
    // On the server, render a sensible default; the effect above corrects
    // it (and the data-theme attribute) as soon as the app hydrates in the browser.
    if (!this.isBrowser) return 'dark';

    const saved = localStorage.getItem(this.storageKey) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    // Fall back to the visitor's OS preference the first time they land.
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
