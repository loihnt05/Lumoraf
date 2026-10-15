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

## Next work

Stage 1 adds Clerk and API-backed user roles. Inventory and booking modes follow
their own backend contracts. Add photography when real property content exists;
the initial page deliberately describes that rooms are not available yet.

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
