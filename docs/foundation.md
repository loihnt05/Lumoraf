# Frontend foundation

## Scope and decisions

This initialization implements P0.1 and P0.4, plus the starter tokens and public
navigation from UI-0/UI-1. The UI plan is reference material for visual direction;
its full booking milestones are not part of codebase initialization.

The root repositories retain their existing names instead of being nested again
under `frontend/` and `backend/`. Product/package names are `lumoraf` and `lumorab`.

## Design conventions

Warm background `#F6F3EE`, white surface, text `#1D1D1B`, muted text `#686862`,
border `#DEDAD2`, and forest accent `#334A40` are CSS variables. Components use theme
tokens. Rounded surfaces use 16–20 px corners. Spacing follows an 8 px base with
smaller increments for compact controls. System fonts keep local builds offline.

Typography utilities: `text-display`, `text-heading`, `text-body`, `text-caption`,
and `text-price`. Public navigation is sticky with an 80 px header and matching
scroll offset. Interactive controls have keyboard focus and reduced-motion support.

Slot vocabulary is AVAILABLE, SELECTED, BOOKED, UNAVAILABLE. Future slot controls
must include visible labels and native disabled semantics. Cleaning gaps map to
Unavailable for guests. Night surcharge badges must reflect a backend quote.
Complete Tabs, Dialog/Drawer, Tooltip and booking pickers when UI-0/booking work
begins; this skeleton provides Button, Badge, Card and Skeleton primitives.

## API rules

- Frontend never decides authoritative availability, price, or business role.
- Call `apiRequest` with an AbortSignal for cancellable work; it enforces a timeout.
- Pass a Clerk session token explicitly once Stage 1 is implemented.
- Handle 401/403/409/422/5xx using `ApiError.status` and its structured body.
- No personal information, room access codes, or tokens in logs.
- Health success means both API and database responded, not merely that HTML loaded.

## Stage UI-1 — App Shell & Sticky Nav

The public navigation and shell are implemented in `src/components/layouts/sticky-nav.tsx`
and `src/components/layouts/public-shell.tsx`:
- Sticky top navigation with subtle border and shadow transition when scrolled (`useSyncExternalStore`).
- Zero Cumulative Layout Shift (CLS) during auth hydration.
- Signed-out state renders a Sonder-inspired "Sign in" pill button that opens a boutique modal (`SignInModal`).
- Signed-in state renders the user avatar, name, and a dropdown menu with "My Bookings" and "Sign out".
- Business roles (USER/MANAGER/ADMIN) are intentionally not displayed from the auth identity layer.
- Development mode includes a quick toggle button to test both signed-in and signed-out states.

## Stage UI-2 — Property & Room Presentation

- Branch switcher (`PropertyHeader`) supporting multi-branch navigation (Đà Lạt and Sài Gòn) with confirmation on selection switch.
- Sonder-inspired 5-photo editorial gallery (`PropertyGallery`) with interactive full-screen modal and thumbnail carousel.
- Physical room cards (`RoomCard`) with photo carousel, capacity/amenities chips, starting price ("From ... / slot 3h"), and blocked room state (`isBlocked = true` prevents selection).
- Contextual booking panel (`RoomBookingPanel`) slides in without leaving the page, synchronized with `?room=roomId` URL search params.

## Stage UI-3 — Booking Mode Selector

- `Tabs` primitive in `src/components/ui/tabs.tsx` using Radix UI with boutique pill segmented styling.
- `BookingModeTabs` in `src/components/booking/booking-mode-tabs.tsx`:
  - Dynamically renders only the enabled modes based on `RoomTypeBookingConfig` contract (Fixed Slot, Custom Time, Overnight).
  - Automatically hides redundant tabs if only 1 mode is enabled for that room type.
  - Resets incompatible transient fields when switching modes.
  - Persists selection per room in `sessionStorage`.
  - Fallback safe state disables action if configuration fails to load.

## Stage UI-4 — Fixed Slot Experience

- Dedicated room page (`/booking/[roomId]`) replacing the side drawer popup as requested:
  - 2-column Sonder-inspired layout with sticky booking card on the right (`sticky top-28`).
  - Breadcrumb and back navigation.
  - Comprehensive room specifications (capacity, bed, size), editorial description, full amenities grid, self check-in guidance, and cleaning policy.
- Date selector (`DateSelector` in `src/components/booking/date-selector.tsx`):
  - 14-day horizontal scrollable strip with local date formatting.
  - Changing date cancels previous slot selection.
- Fixed slot picker (`FixedSlotPicker` in `src/components/booking/fixed-slot-picker.tsx`):
  - 5 standard slots: 07:00-10:00, 10:30-13:30, 14:00-17:00, 17:30-20:30, 21:00-00:00.
  - Cleaning buffer 30m is not rendered as a slot for customers.
  - Slot 5 touches night window (23:00-06:00) with a mock +20% night surcharge badge.
  - Clear `AVAILABLE`, `SELECTED`, and `BOOKED` states (booked slots are non-clickable and keyboard-inaccessible).
  - Availability refresh capability (`handleRefreshSlots`) on date change or manual refresh trigger.
  - Dynamic slot price calculation and reserve CTA updating to selected slot range.

## Stage UI-5 — Custom Time Experience

- Custom time controls (`CustomTimePicker` in `src/components/booking/custom-time-picker.tsx`):
  - Strictly 30-minute steps (`:00`, `:30`).
  - Enforced minimum duration: 180 minutes (3 hours) with realtime duration feedback.
  - Cross-midnight selection support with explicit `+1 ngày (Hôm sau)` indicators.
  - Night window surcharge calculation (+20% on hours between 23:00 and 06:00).
- Availability timeline (`AvailabilityTimeline` in `src/components/booking/availability-timeline.tsx`):
  - 18h visual bar (06:00 to 24:00) with 2h ticks.
  - Displays booked + cleaning turnover gaps as generic "Đã bận / Không khả dụng".
  - Overlays customer's custom selection in realtime with conflict pulse animation.
  - Screen reader accessible list of unavailable intervals.
- Conflict-aware validation:
  - Overlap check prevents choosing windows intersecting unavailable ranges.
  - Boundary check: `end == unavailable.start` valid because cleaning buffer is already factored in.
  - Reserve action is disabled until the range is completely valid and conflict-free.

## Stage UI-6 — Overnight Experience

- Multi-night date range picker (`OvernightPicker` in `src/components/booking/overnight-picker.tsx`):
  - Check-in date input with 14:00 time preset.
  - Check-out date input with 11:00 time preset.
  - Quick stay duration pills ("1 đêm", "2 đêm", "3 đêm", "5 đêm", "1 tuần").
  - Cleaning buffer (60m) handled automatically by backend availability without requiring guest input.
- Separate overnight pricing model (UI-6.2):
  - Does NOT use custom hourly pricing to compute overnight stays.
  - Itemized quote breakdown: `pricePerNight × numberOfNights`, standard cleaning included, automated room access code.
  - Realtime validation ensures `checkOut > checkIn` and guards against occupied nights.

## Next work

Milestone M4: Stage UI-7 (Authoritative quote, summary panel, cancellation policy) & Stage UI-8 (Reserve action, pending booking screen, mock payment handoff).




## Bootstrap verification

Verified on 15 October 2026 with Node 24: lint, strict TypeScript, four API-client
tests and the Next.js production build pass. The dependency audit reports five
high-severity entries in the development-only Next ESLint / fast-glob /
micromatch / braces chain (GHSA-vfj7-8cjw-p6xm). The registry currently offers no
patched braces release; do not force-downgrade Next's lint config to resolve it.
Runtime dependency audit is clean. Recheck the lint dependency chain before CI
starts accepting untrusted repository patterns.
ESLint is pinned to 9.39.5 because Next's bundled import, accessibility and React
plugins do not yet declare ESLint 10 support; update this toolchain together.
