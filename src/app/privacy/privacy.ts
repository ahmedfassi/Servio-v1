import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { I18nService } from '../services/i18n.service';
import { TranslatePipe } from '../pipes/translate.pipe';

type LegalTab = 'privacy' | 'terms';

@Component({
  selector: 'app-privacy',
  imports: [TranslatePipe],
  templateUrl: './privacy.html',
  styleUrl: './privacy.css',
})
export class Privacy {
  theme = inject(ThemeService);
  i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly activeTab = signal<LegalTab>('privacy');

  showTab(tab: LegalTab): void {
    this.activeTab.set(tab);
  }

  // Mobile navbar state
  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /** Navigates back to the home page and scrolls to a given section there,
   *  without ever putting a #hash in the address bar. The target id is
   *  passed as router state and picked up by Home once it loads. */
  goToHomeSection(id: string, event: Event): void {
    event.preventDefault();
    this.router.navigate(['/'], { state: { scrollTo: id } });
  }

  /** Same as goToHomeSection, but also closes the mobile menu. */
  navigateToHomeSection(id: string, event: Event): void {
    this.goToHomeSection(id, event);
    this.closeMobileMenu();
  }
}