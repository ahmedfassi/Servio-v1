# Servio — Developer Guide

This document maps out the project so any contributor can find "where do I change X" quickly. It reflects the app as of the current codebase (Angular 21, standalone components, SSR via `@angular/ssr`).

---

## 1. Project structure at a glance

```
src/
├── main.ts                  # Browser bootstrap entry point
├── main.server.ts           # SSR bootstrap entry point
├── server.ts                # Express server for SSR (production)
├── index.html                # Root HTML shell, fonts, <app-root>
├── styles.css                 # GLOBAL styles + theme tokens (see §3)
│
└── app/
    ├── app.ts / app.html / app.css     # Root component — just <router-outlet>
    ├── app.config.ts                   # App-wide providers (router, hydration)
    ├── app.config.server.ts            # SSR-specific providers
    ├── app.routes.ts                   # Route definitions (see §2)
    ├── app.routes.server.ts            # SSR render-mode config (prerender)
    │
    ├── home/
    │   ├── home.ts            # Landing page component logic
    │   ├── home.html          # Landing page markup (hero, about, features, flow, contact)
    │   └── home.css           # Landing page styles (scoped to this component)
    │
    ├── privacy/
    │   ├── privacy.ts         # Privacy/Terms page logic (tab switching)
    │   ├── privacy.html
    │   └── privacy.css
    │
    ├── services/
    │   ├── theme.service.ts       # Light/dark mode state + persistence (see §3)
    │   ├── i18n.service.ts        # Language state + persistence (see §4)
    │   └── translations.ts        # ALL translated text lives here (see §4)
    │
    ├── pipes/
    │   └── translate.pipe.ts      # `{{ 'some.key' | translate }}` pipe
    │
    ├── scroll-reveal.ts               # Scroll-in animation directive (see §5)
    └── scroll-direction.service.ts    # Tracks scroll up/down for the directive
```

---

## 2. Routing — add or change a page

File: **`src/app/app.routes.ts`**

```typescript
export const routes: Routes = [
    { path: '', component: Home },
    { path: 'policies', component: Privacy },
];
```

To add a new page:
1. Generate a component folder under `src/app/` (e.g. `src/app/pricing/`) with `.ts`, `.html`, `.css`.
2. Import it and add a route entry here.
3. If it should be **prerendered/SSR'd**, no extra step needed — `app.routes.server.ts` currently prerenders `**` (everything) by default.
4. Add a nav link to it in `home.html` / `privacy.html` `<nav>` sections if it should appear in the header.

---

## 3. Theme (light/dark mode) — change colors or add new tokens

- **Logic:** `src/app/services/theme.service.ts` — toggles a signal, writes `data-theme="dark"|"light"` onto `<html>`, persists to `localStorage`.
- **Colors:** `src/styles.css` — all color tokens are CSS custom properties defined twice, once per theme:

```css
:root, html[data-theme='dark'] { --bg: #0D0D0D; --sandy: #FFA04A; /* ... */ }
html[data-theme='light']       { --bg: #F5F7FA; --sandy: #FF8F2E; /* ... */ }
```

**To change a color:** edit the variable value in `styles.css`. It cascades everywhere automatically — components never hardcode hex values, they reference `var(--token-name)`.

**To add a new token:** add it to both blocks in `styles.css`, then use `var(--your-token)` in any component's CSS file.

**Important:** because of Angular's style encapsulation, any CSS rule that needs to react to the `data-theme` attribute on `<html>` (rather than just using a variable) must live in `styles.css`, not a component's own `.css` file — component styles can't "see" attributes on ancestors outside their own template.

---

## 4. Text & translations — change copy or add a language

- **All UI text** lives in one place: **`src/app/services/translations.ts`** — a `Record<Lang, Record<string, string>>` with `en` and `ar` keys.
- **Never hardcode text in `.html` files.** Templates use the pipe: `{{ 'some.key' | translate }}`.
- **To change existing copy:** find the key in `translations.ts` and edit the string (both `en` and `ar` if applicable).
- **To add new copy:** add the key to *both* language blocks in `translations.ts`, then reference it in the template with the pipe.
- **To add a new language:**
  1. Add the language code to the `Lang` type at the top of `translations.ts`.
  2. Add a full translation block for it (copy the `en` block as a starting template).
  3. `i18n.service.ts` handles persistence/detection automatically — no changes needed there unless you want custom fallback logic.
- **RTL languages:** `styles.css` already swaps to a different font stack when `dir="rtl"` is set (see the `html[dir='rtl']` rules). `i18n.service.ts` sets `dir` automatically based on language.

---

## 5. Scroll animations — change how sections animate in

- **Directive:** `src/app/scroll-reveal.ts` — apply `appScrollReveal` to any element in a template to animate it in on scroll.
- **Direction tracking:** `src/app/scroll-direction.service.ts` — shared service so animations only play when scrolling down (or arriving via nav-bar jump), not when scrolling back up.
- **Animation styles:** currently living in `home.css` under `/* SCROLL REVEAL */` — the `.scroll-reveal`, `.reveal-up/left/right/zoom`, and `.is-visible` classes.

**Directive inputs (usable on any element with `appScrollReveal`):**

| Input | Default | Purpose |
|---|---|---|
| `[revealDelay]` | `0` | Stagger delay in ms, useful in `@for` loops (`i * 80`) |
| `[revealVariant]` | `'up'` | `'up'` \| `'left'` \| `'right'` \| `'zoom'` — entrance style |
| `[revealRepeat]` | `true` | Set to `false` to animate only once instead of every time it re-enters view |

**To animate a new element:** just add `appScrollReveal` (plus optional inputs) to it in the template. No service/component wiring needed.

**To change the animation look (timing, distance, blur, etc.):** edit the CSS rules in `home.css` — currently scoped there since all animated elements today live on the home page. If you add `appScrollReveal` elements to `privacy.html` or a new page, copy the same CSS block into that component's `.css` file (component-scoped styles work fine here since nothing needs to reach outside the component, unlike the theme tokens in §3).

---

## 6. Adding a new reusable UI piece (e.g. a button style, a card)

- Keep truly global/reusable primitives (fonts, resets, focus states) in `src/styles.css`.
- Keep anything specific to a single page/section inside that component's own `.css` file (`home.css`, `privacy.css`, etc.) — this is the Angular-idiomatic default and avoids leaking styles across pages.
- If a piece of UI (e.g. a pill badge, a card) is reused across multiple pages, consider extracting it into its own standalone component under `src/app/shared/` (not created yet — create this folder if/when the first shared component is needed) rather than duplicating CSS.

---

## 7. Testing

- Tests run via Vitest (`ng test` / `npm test`).
- Each component has a co-located `*.spec.ts` file (e.g. `home.spec.ts`, `privacy.spec.ts`).
- `scroll-reveal.spec.ts` currently only smoke-tests instantiation — if the directive's dependencies change (e.g. `ScrollDirectionService` is now injected), make sure the spec still constructs it correctly via `TestBed` rather than `new ScrollRevealDirective()` directly, since it now has an injected dependency.

---

## 8. Quick reference — "I want to..."

| Task | File(s) to touch |
|---|---|
| Change a color / theme token | `src/styles.css` |
| Change any text on the site | `src/app/services/translations.ts` |
| Add a new page/route | `src/app/app.routes.ts` + new component folder |
| Change hero/features/flow/contact section layout | `src/app/home/home.html` + `home.css` |
| Change privacy/terms content | `src/app/privacy/privacy.html` + `translations.ts` |
| Change scroll-in animation behavior | `src/app/scroll-reveal.ts`, `scroll-direction.service.ts` |
| Change scroll-in animation look | `home.css` (`.scroll-reveal` rules) |
| Add/change a language | `src/app/services/translations.ts`, `i18n.service.ts` |
| Change dark/light mode logic | `src/app/services/theme.service.ts` |
| Change SSR/build config | `angular.json`, `app.config.server.ts`, `app.routes.server.ts` |
