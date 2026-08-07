import { Directive, ElementRef, Input, OnDestroy, OnInit, PLATFORM_ID, Renderer2, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollDirectionService } from './scroll-direction.service';

export type RevealVariant = 'up' | 'left' | 'right' | 'zoom';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly scrollDir = inject(ScrollDirectionService);
  private observer?: IntersectionObserver;

  /** Delay in ms, useful for staggering a list of items */
  @Input() revealDelay = 0;

  /** Entrance style: 'up' (default), 'left', 'right', or 'zoom' */
  @Input() revealVariant: RevealVariant = 'up';

  /** If true (default), resets and replays every time the element re-enters
   *  the viewport while scrolling down. Scrolling up never re-animates. */
  @Input() revealRepeat = true;

  ngOnInit(): void {
    // IntersectionObserver doesn't exist during SSR (no window/DOM on the server).
    // Skip entirely there; the element just renders in its normal (visible) state,
    // and the directive picks up the animation once it runs again in the browser.
    if (!this.isBrowser) return;

    const element = this.el.nativeElement;
    this.renderer.addClass(element, 'scroll-reveal');
    this.renderer.addClass(element, `reveal-${this.revealVariant}`);

    if (this.revealDelay) {
      this.renderer.setStyle(element, 'transition-delay', `${this.revealDelay}ms`);
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (this.scrollDir.direction === 'up') {
              // Scrolling up: reveal instantly, no animation.
              this.renderer.addClass(element, 'no-transition');
              this.renderer.addClass(element, 'is-visible');
              requestAnimationFrame(() => {
                this.renderer.removeClass(element, 'no-transition');
              });
            } else {
              // Scrolling down (or nav-bar jump landing here): animate in normally.
              this.renderer.addClass(element, 'is-visible');
            }

            if (!this.revealRepeat) {
              this.observer?.unobserve(element);
            }
          } else if (this.revealRepeat) {
            // Left the viewport: reset so it can animate in again on the next downward pass.
            this.renderer.removeClass(element, 'is-visible');
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