import { Directive, ElementRef, Input, OnDestroy, OnInit, PLATFORM_ID, Renderer2, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  /** Delay in ms, useful for staggering a list of items */
  @Input() revealDelay = 0;

  ngOnInit(): void {
    // IntersectionObserver doesn't exist during SSR (no window/DOM on the server).
    // Skip entirely there; the element just renders in its normal (visible) state,
    // and the directive picks up the animation once it runs again in the browser.
    if (!this.isBrowser) return;

    const element = this.el.nativeElement;
    this.renderer.addClass(element, 'scroll-reveal');

    if (this.revealDelay) {
      this.renderer.setStyle(element, 'transition-delay', `${this.revealDelay}ms`);
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.renderer.addClass(element, 'is-visible');
            this.observer?.unobserve(element);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}