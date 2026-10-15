# lumoraf

Lumora frontend foundation: Next.js App Router, React, strict TypeScript, Tailwind
CSS, and shadcn-compatible Radix primitives. Requires Node.js 22+ and npm.

## Run locally

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

On macOS/Linux, use `cp .env.example .env.local` instead of `Copy-Item`.
Open http://localhost:3000/booking. `/` redirects there. Start `lumorab` on port
8080 first to see a successful development connection check. An unavailable API
leaves the page usable and shows an explicit retry state.

`NEXT_PUBLIC_API_BASE_URL` is the backend URL reachable by the browser, not an
internal container hostname. It is public and embedded at build time. Restart
the dev server or rebuild after changing it. Never put secrets in public variables.

## Checks

```sh
npm run check
npm run format:check
```

`check` runs ESLint, TypeScript, API-client tests, and a production build.
`npm run start` serves the production build. The development connection card is
intentionally omitted from production. Use `/api/health` directly to check the API.

## Structure

```text
src/app/                  Routes and loading/error boundaries
  (public)/               Public shell, /booking and home redirect
src/components/layouts/   Public and account/manager/admin shell foundations
src/components/ui/        Reusable visual primitives
src/lib/api/              Environment-aware API client and contracts
src/lib/booking-states.ts  Presentation labels, not availability logic
docs/                     UI conventions and next-phase boundaries
```

Use `@/` imports and PascalCase component exports. Keep feature components near
their feature; add shared hooks under `src/hooks` when needed. Route files compose
components; API calls belong in `src/lib/api`. `components.json` configures future
shadcn additions. Shared colors and typography live in `src/app/globals.css`.

## Phase boundary

There are no mocked rooms, price calculations, booking endpoints, or pretend login
flows. Account access is labeled as coming soon. `WorkspaceShell` supports account,
manager, and admin layouts, but is **not** an authorization guard. Add Clerk route
protection and backend-enforced permissions in Stage 1 before exposing those pages.
The API client can accept a token; it does not persist one or assume a user role.

See `docs/foundation.md` for design conventions and the Stage 0 checklist.
