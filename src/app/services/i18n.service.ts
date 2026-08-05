import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TRANSLATIONS, Lang } from './translations';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly storageKey = 'servio-lang';
  // Same SSR guard as ThemeService — this runs on the Node server first,
  // where document/localStorage/navigator don't exist.
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly value = signal<Lang>(this.getInitialLang());

  constructor() {
    effect(() => {
      const current = this.value();
      if (!this.isBrowser) return;
      document.documentElement.setAttribute('lang', current);
      document.documentElement.setAttribute('dir', current === 'ar' ? 'rtl' : 'ltr');
      localStorage.setItem(this.storageKey, current);
    });
  }

  toggle(): void {
    this.value.set(this.value() === 'en' ? 'ar' : 'en');
  }

  /** Look up a translation key for the active language. */
  t(key: string): string {
    return TRANSLATIONS[this.value()][key] ?? key;
  }

  private getInitialLang(): Lang {
    // Server-rendered default; corrected client-side by the effect above
    // once the app hydrates in the browser.
    if (!this.isBrowser) return 'en';

    const saved = localStorage.getItem(this.storageKey) as Lang | null;
    if (saved === 'en' || saved === 'ar') return saved;
    return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }
}
