import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ScrollDirection = 'up' | 'down';

/**
 * Tracks the page's current scroll direction so other things (like
 * ScrollRevealDirective) can decide whether to animate. One shared
 * listener for the whole app instead of one per directive instance.
 */
@Injectable({ providedIn: 'root' })
export class ScrollDirectionService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private lastY = 0;
  private _direction: ScrollDirection = 'down';
  private listener?: () => void;

  /** Current scroll direction. Defaults to 'down' so above-the-fold
   *  content still animates in on first load. */
  get direction(): ScrollDirection {
    return this._direction;
  }

  constructor() {
    if (!this.isBrowser) return;

    this.lastY = window.scrollY;
    this.listener = () => {
      const currentY = window.scrollY;
      if (currentY > this.lastY) {
        this._direction = 'down';
      } else if (currentY < this.lastY) {
        this._direction = 'up';
      }
      this.lastY = currentY;
    };

    window.addEventListener('scroll', this.listener, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.listener) {
      window.removeEventListener('scroll', this.listener);
    }
  }
}