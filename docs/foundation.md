# Frontend Foundation (Stage 0 & Stage UI-0)

> **Lưu ý cấu trúc tài liệu**: Tài liệu của từng Stage UI đã được tách riêng thành từng tệp độc lập trong thư mục [`docs/stages/`](./stages/). Xem mục lục đầy đủ tại [`docs/README.md`](./README.md).

## Scope and decisions

This initialization implements P0.1 and P0.4, plus the starter tokens and public
navigation from UI-0/UI-1. The root repositories retain their existing names (`Lumoraf` and `Lumorab`), with product/package names `lumoraf` and `lumorab`.

## Design conventions

Warm background `#F6F3EE`, white surface, text `#1D1D1B`, muted text `#686862`,
border `#DEDAD2`, and forest accent `#334A40` are CSS variables. Components use theme
tokens. Rounded surfaces use 16–20 px corners. Spacing follows an 8 px base with
smaller increments for compact controls. System fonts keep local builds offline.

Typography utilities: `text-display`, `text-heading`, `text-body`, `text-caption`,
and `text-price`. Public navigation is sticky with an 80 px header and matching
scroll offset. Interactive controls have keyboard focus and reduced-motion support.

Slot vocabulary is `AVAILABLE`, `SELECTED`, `BOOKED`, `UNAVAILABLE`. Cleaning gaps map to
Unavailable for guests. Night surcharge badges reflect an authoritative quote.

## API rules

- Frontend never decides authoritative availability, price, or business role.
- Call `apiRequest` with an AbortSignal for cancellable work; it enforces a timeout.
- Pass a Clerk session token explicitly once connected to a live Clerk tenant.
- Handle 401/403/409/422/5xx using `ApiError.status` and its structured body.
- No personal information, room access codes, or tokens in logs.
- Health success means both API and database responded, not merely that HTML loaded.

## Dedicated Stage Documentation Files (`docs/stages/`)

- [Stage UI-0 — UX Foundation & State Conventions](./stages/stage-ui-0-foundation.md)
- [Stage UI-1 — App Shell, Sticky Nav & Auth States](./stages/stage-ui-1-app-shell-nav.md)
- [Stage UI-2 — Property & Physical Room Presentation](./stages/stage-ui-2-property-room-presentation.md)
- [Stage UI-3 — Booking Mode Selector](./stages/stage-ui-3-booking-mode-selector.md)
- [Stage UI-4 — Fixed Slot 3h Experience](./stages/stage-ui-4-fixed-slot.md)
- [Stage UI-5 — Custom Time 30m Experience](./stages/stage-ui-5-custom-time.md)
- [Stage UI-6 — Overnight Experience](./stages/stage-ui-6-overnight.md)
- [Stage UI-7 — Authoritative Quote, Night Surcharge & Summary](./stages/stage-ui-7-quote-summary.md)
- [Stage UI-8 — Reserve, 15m Hold & Mock Payment Checkout](./stages/stage-ui-8-reserve-checkout-payment.md)
- [Stage UI-9 — Admin Config UI for Time, Slots, Price & Room Blocking](./stages/stage-ui-9-admin-config-blocking.md)
- [Stage UI-10 — Mobile Responsive, Edge States & WCAG AA Accessibility](./stages/stage-ui-10-responsive-a11y-edge-states.md)
- [Stage UI-11 — Component & End-to-End Smoke Flow Verification](./stages/stage-ui-11-e2e-verification.md)
- [System Stages 2, 6 & 7 — Manager Console, Admin Monitor, RBAC, Refund, QR & Smart Lock PIN](./stages/stage-ops-2-6-7-manager-admin-refund-qr.md)

## Bootstrap & Final Verification

Verified on 18 October 2026: ESLint (`0 warnings`), strict TypeScript (`next typegen && tsc --noEmit`), 5 Vitest test suites (`21/21 passing tests`), and the Next.js 16 production build pass cleanly.
