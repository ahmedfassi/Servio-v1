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
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_NOTIFICATION_TEMPLATE_ID'; // sent to your team inbox
const EMAILJS_AUTOREPLY_TEMPLATE_ID = 'YOUR_AUTOREPLY_TEMPLATE_ID'; // sent back to the visitor
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

// EmailJS throttles requests fired back-to-back from the same public key.
// Waiting a beat between the two sends avoids the second one getting silently dropped.
const DELAY_BETWEEN_SENDS_MS = 1200;

const SUBJECT_LABELS: Record<string, string> = {
  partnership: 'Partnership',
  business: 'Business',
  userInquiry: 'User Inquiry',
  appInquiry: 'App Inquiry',
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** EmailJS errors are usually { status, text } rather than a normal Error —
 *  pull out something readable regardless of shape. */
function describeEmailJsError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; text?: string; message?: string };
    if (e.status || e.text) return `status ${e.status ?? '?'}: ${e.text ?? '(no text)'}`;
    if (e.message) return e.message;
  }
  return String(err);
}

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

    const subjectLabel = SUBJECT_LABELS[payload.subject] ?? 'General';
    const sentDate = new Date().toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // 1. Notification to the Serv.io team — this one has to succeed for the
    //    submission to count as successful.
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        first_name: payload.firstName,
        last_name: payload.lastName,
        from_email: payload.email,
        phone: payload.phone || '—',
        subject_label: subjectLabel,
        message: payload.message,
      });
    } catch (err) {
      console.error('Contact form notification failed to send —', describeEmailJsError(err));
      this.state.set('error');
      return false;
    }

    this.state.set('success');

    // 2. Auto-reply confirmation back to the visitor. Waits briefly first to
    //    avoid EmailJS's back-to-back rate limiting, and is awaited (not
    //    fire-and-forget) so a failure here is actually logged with detail
    //    instead of silently vanishing. It still never flips the form to an
    //    error state — the team already has the message either way.
    await wait(DELAY_BETWEEN_SENDS_MS);
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_AUTOREPLY_TEMPLATE_ID, {
        to_email: payload.email,
        first_name: payload.firstName,
        message: payload.message,
        subject_label: subjectLabel,
        sent_date: sentDate,
      });
    } catch (err) {
      console.error('Auto-reply email failed to send —', describeEmailJsError(err));
    }

    return true;
  }

  reset(): void {
    this.state.set('idle');
  }
}