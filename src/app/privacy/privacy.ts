import { Component, inject, signal } from '@angular/core';
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
}