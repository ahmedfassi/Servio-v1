import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import emailjs from '@emailjs/browser';

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export type ContactState = 'idle' | 'sending' | 'success' | 'error';

// From your EmailJS dashboard — https://dashboard.emailjs.com
const EMAILJS_SERVICE_ID = 'service_8xyoaed';
const EMAILJS_TEMPLATE_ID = 'template_2g2s1tq';
const EMAILJS_PUBLIC_KEY = 'wfEVYFzfFKBvN6e94';

const SUBJECT_LABELS: Record<string, string> = {
  partnership: 'Partnership',
  business: 'Business',
  userInquiry: 'User Inquiry',
  appInquiry: 'App Inquiry',
};

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly state = signal<ContactState>('idle');

  constructor() {
    // emailjs touches the DOM/fetch — only initialize it in the browser,
    // never during the SSR pass on the server.
    if (this.isBrowser) {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }
  }

  async submit(payload: ContactPayload): Promise<boolean> {
    if (!this.isBrowser) return false;

    this.state.set('sending');
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        first_name: payload.firstName,
        last_name: payload.lastName,
        from_email: payload.email,
        phone: payload.phone || '—',
        subject_label: SUBJECT_LABELS[payload.subject] ?? 'General',
        message: payload.message,
      });
      this.state.set('success');
      return true;
    } catch {
      this.state.set('error');
      return false;
    }
  }

  reset(): void {
    this.state.set('idle');
  }
}