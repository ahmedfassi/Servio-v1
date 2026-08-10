import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { I18nService } from '../services/i18n.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ScrollRevealDirective } from '../scroll-reveal';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'checkout';

interface FeatureDef {
  key: string;      // matches feature.<key>.title / feature.<key>.desc in translations.ts
  icon: string;      // SVG path data
  color: string;     // CSS variable to use for the icon tile background
}

interface FlowStepDef {
  key: string; // matches flow.step<N>Title / flow.step<N>Desc
}

@Component({
  selector: 'app-root',
  imports: [TranslatePipe, ScrollRevealDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit, OnDestroy {
  theme = inject(ThemeService);
  i18n = inject(I18nService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly features: FeatureDef[] = [
    { key: 'menu', color: 'var(--cyan)', icon: 'M4 4h16v4H4zM4 10h16v10H4z' },
    { key: 'qr', color: 'var(--sandy)', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM17 17h3v3h-3z' },
    { key: 'table', color: 'var(--lavender)', icon: 'M4 6h16v12H4zM4 10h16M9 6v12' },
    { key: 'tracking', color: 'var(--coral)', icon: 'M12 6v6l4 2' },
    { key: 'checkout', color: 'var(--apricot)', icon: 'M4 12h16M14 6l6 6-6 6' },
    { key: 'roles', color: 'var(--indigo)', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 4-6 8-6s8 2 8 6' },
    { key: 'payment', color: 'var(--cyan)', icon: 'M3 7h18v10H3zM3 11h18M7 15h4' },
    { key: 'analytics', color: 'var(--sandy)', icon: 'M4 20V10M10 20V4M16 20v-8M22 20H2' },
  ];

  readonly flowSteps: FlowStepDef[] = [
    { key: 'step1' }, { key: 'step2' }, { key: 'step3' }, { key: 'step4' }, { key: 'step5' },
  ];

  // Live floor widget state
  readonly tables = signal(this.buildInitialTables());
  private intervalId?: ReturnType<typeof setInterval>;
  private reduceMotion = false;
  // Mobile navbar state
  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /** Height of the sticky header, used to offset scroll targets so section
   *  titles don't end up hidden underneath it. Keep in sync with .site-header
   *  height in home.css. */
  private readonly headerOffset = 76;

  constructor() {
    // If we arrived here from another route (e.g. the privacy page) wanting
    // to land on a specific section, scroll to it once the view has rendered.
    // Runs client-side only, and never touches the URL/hash.
    afterNextRender(() => {
      if (!this.isBrowser) return;
      const state = history.state as { scrollTo?: string } | null;
      if (state?.scrollTo) {
        this.scrollToId(state.scrollTo);
        // Clear it so a manual refresh or back/forward doesn't re-trigger the scroll.
        history.replaceState({ ...history.state, scrollTo: undefined }, '');
      }
    });
  }

  private scrollToId(id: string): void {
    const target = document.getElementById(id);
    if (!target) return;
    const targetY = target.getBoundingClientRect().top + window.scrollY - this.headerOffset;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  /** Smooth-scrolls to a section by id without letting the browser write a
   *  hash into the address bar (unlike a plain <a href="#id">). */
  scrollToSection(id: string, event: Event): void {
    event.preventDefault();
    if (!this.isBrowser) return;
    this.scrollToId(id);
  }

  /** Same as scrollToSection, but also closes the mobile menu — for links
   *  inside the mobile nav drawer. */
  navigateToSection(id: string, event: Event): void {
    this.scrollToSection(id, event);
    this.closeMobileMenu();
  }

  ngOnInit(): void {
    if (!this.isBrowser) return; // no window/setInterval on the SSR server pass

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.reduceMotion) {
      this.intervalId = setInterval(() => this.randomizeOneTable(), 2200);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private buildInitialTables(): { id: number; status: TableStatus }[] {
    const layout: TableStatus[] = [
      'available', 'available', 'available', 'available', 'available',
      'occupied', 'occupied', 'occupied', 'occupied',
      'reserved', 'reserved',
      'checkout',
    ];
    return layout.map((status, i) => ({ id: i + 1, status }));
  }

  private randomizeOneTable(): void {
    const statuses: TableStatus[] = ['available', 'occupied', 'reserved', 'checkout'];
    const current = this.tables();
    const idx = Math.floor(Math.random() * current.length);
    const next = statuses[Math.floor(Math.random() * statuses.length)];
    this.tables.set(
      current.map((t, i) => (i === idx ? { ...t, status: next } : t))
    );
  }
  
}