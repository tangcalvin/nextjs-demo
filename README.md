## Next.js Demo – MUI Layout, OIDC Auth, and Form Validation

This project is a **Next.js App Router demo** that showcases:

- **Next.js + Material UI layout** with a persistent sidebar, header, and static footer.
- **OIDC authentication (PKCE)** using `oidc-client-ts` with Keycloak as the identity provider, with a feature flag to enable/disable auth per environment.
- **Modern form handling and validation** using `react-hook-form` and `zod`.

You can optionally rename the folder `nextjs-test` to `nextjs-demo` on your machine (e.g. `mv nextjs-test nextjs-demo`); no code changes are required other than updating any local paths or editor workspace references.

---

## Getting Started

From the project folder (e.g. `nextjs-demo`):

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Environment configuration

Authentication is controlled entirely via **public env vars**:

- `NEXT_PUBLIC_AUTH_ENABLED` – `'true'` to enable OIDC authentication, `'false'` to run the app without auth.
- `NEXT_PUBLIC_OIDC_URL` – base URL of your OIDC provider (e.g. Keycloak: `http://localhost:9090`).
- `NEXT_PUBLIC_OIDC_REALM` – realm name (for Keycloak) or leave empty for direct OIDC issuer URLs.
- `NEXT_PUBLIC_OIDC_CLIENT_ID` – public SPA client ID configured for PKCE.
- `NEXT_PUBLIC_OIDC_ONLOAD` – `login-required` or `check-sso` (defaults to `check-sso`).
- `NEXT_PUBLIC_OIDC_REFRESH_INTERVAL_SECONDS` – interval in seconds for checking token expiry (defaults to `15`).
- `NEXT_PUBLIC_OIDC_PROACTIVE_REFRESH_THRESHOLD_SECONDS` – threshold in seconds for proactive token refresh (defaults to `60`). Tokens expiring within this threshold will be refreshed automatically.

Example `.env.local`:

```env
NEXT_PUBLIC_AUTH_ENABLED=false

# When you want to enable auth:
# NEXT_PUBLIC_AUTH_ENABLED=true
# NEXT_PUBLIC_OIDC_URL=http://localhost:9090
# NEXT_PUBLIC_OIDC_REALM=vite-test
# NEXT_PUBLIC_OIDC_CLIENT_ID=vite-spa
# NEXT_PUBLIC_OIDC_ONLOAD=check-sso
# NEXT_PUBLIC_OIDC_REFRESH_INTERVAL_SECONDS=15  # Optional: token refresh check interval (default: 15 seconds)
# NEXT_PUBLIC_OIDC_PROACTIVE_REFRESH_THRESHOLD_SECONDS=60  # Optional: proactive refresh threshold (default: 60 seconds)
```

When auth is **enabled**, the header shows a login/logout icon and protected routes require sign-in.  
When auth is **disabled**, the app behaves as fully public and skips OIDC authentication entirely.

---

## Key Features

- **Responsive MUI shell**
  - App bar with project title and optional user/login controls.
  - Permanent left-hand drawer with navigation:
    - `Users` – user details demo form.
    - `Contacts` – contact search + results table.
  - Static footer pinned to the bottom with:
    - Dynamic year (`© <current year>`).
    - Link to HTML sitemap (`/site-map`) and XML sitemap (`/sitemap.xml`).

- **OIDC Authentication (using oidc-client-ts)**
  - Frontend-only OIDC integration using `oidc-client-ts` (works with Keycloak or any OIDC provider).
  - Central `OidcAuthService` that:
    - Handles PKCE login, token refresh, and logout.
    - Maintains auth state in a small observable store.
    - Supports automatic silent token renewal.
  - **Automatic access token refresh**:
    - Periodic token expiry check (configurable via `NEXT_PUBLIC_OIDC_REFRESH_INTERVAL_SECONDS`, default: 15 seconds).
    - Proactive token refresh when access token expires within a threshold (configurable via `NEXT_PUBLIC_OIDC_PROACTIVE_REFRESH_THRESHOLD_SECONDS`, default: 60 seconds).
    - Automatic silent renewal using refresh tokens (requires `offline_access` scope).
    - Graceful error handling for expired sessions ("Session not active" errors) that clears user state and allows re-authentication.
    - Event-driven refresh on `AccessTokenExpiring` events from `oidc-client-ts`.
  - `AuthProvider` exposes a `useAuth()` hook with `status`, `profile`, `token`, and `login/logout/refresh` helpers.
  - `AuthGate` component wraps protected content and:
    - Shows a loading card while auth initialises.
    - Shows an error card when auth fails.
    - Shows a "Sign in" card when unauthenticated.
    - Renders children normally when authenticated or when auth is disabled.

- **Forms and validation**
  - **Users page** (`/users`):
    - Uses `react-hook-form` + `zod` schema (`userFormSchema`) for validation.
    - Fields: first/last name, email, age, gender, country, birth date, appointment, and required stock autocomplete.
    - Live JSON preview of what will be submitted (with normalised date formats).
    - Submits to a dummy API (`/api/users`) with a short artificial delay and shows the response.
  - **Contacts page** (`/contacts`):
    - Search form using `react-hook-form` + `zod` schema (`contactQuerySchema`).
    - Validations:
      - Email format.
      - "At least one criterion" enforced in the schema.
    - Calls `/api/contacts` (dummy data), applies client-side filtering, and displays results in a **MUI DataGrid**.
    - Shows a **DataGrid-based skeleton** while loading, with no preloaded data before first search.
    - **Periodic data refresh**: The contacts API uses Next.js `unstable_cache` to cache data server-side and automatically refresh it every 60 seconds. Each contact includes a `refreshed_at` timestamp that indicates when the cache was last refreshed, allowing users to see when the data was last updated.

---

## Automatic Refresh Mechanisms

This demo includes two types of automatic refresh mechanisms:

### 1. Automatic Access Token Refresh

The OIDC authentication service automatically manages access token lifecycle:

- **Periodic expiry check**: Runs every `NEXT_PUBLIC_OIDC_REFRESH_INTERVAL_SECONDS` (default: 15 seconds) to monitor token expiry.
- **Proactive refresh**: When an access token expires within `NEXT_PUBLIC_OIDC_PROACTIVE_REFRESH_THRESHOLD_SECONDS` (default: 60 seconds), it's automatically refreshed before expiration.
- **Event-driven refresh**: Listens to `AccessTokenExpiring` events from `oidc-client-ts` and triggers immediate refresh.
- **Silent renewal**: Uses refresh tokens (with `offline_access` scope) to silently obtain new access tokens without user interaction.
- **Error handling**: Gracefully handles "Session not active" errors by clearing user state and allowing seamless re-authentication.

This ensures users remain authenticated without interruption, even during long sessions.

### 2. Periodic Data Refresh

The contacts API demonstrates server-side data caching with automatic refresh:

- **Server-side caching**: Uses Next.js `unstable_cache` to cache contact data on the server.
- **Automatic refresh**: Cache is automatically refreshed every 60 seconds.
- **Timestamp tracking**: Each contact includes a `refreshed_at` timestamp that only changes when the cache is refreshed, not on every request.
- **Performance**: Reduces database/API load while ensuring data freshness.

The `refreshed_at` timestamp is displayed in the contacts table, allowing users to see when the data was last updated.

---

## Project Structure (high level)

- `src/app/layout.tsx`  
  Root layout that applies global fonts, styles, and wraps the app with `MUIRoot`.

- `src/app/MUIRoot.tsx`  
  MUI shell:
  - Provides theme, app bar, sidebar, scrollable main content, and footer.
  - Wraps content with `AuthProvider` so auth is available across the app.

- `src/app/page.tsx`  
  Landing page that:
  - Shows a professional hero card with a **Sign in** CTA when auth is enabled and user is not logged in.
  - Provides quick links to `Users` and `Contacts`.

- `src/app/_auth/*`  
  Authentication layer:
  - `env.ts` – reads `NEXT_PUBLIC_AUTH_*` vars and `enabled` flag.
  - `types.ts` – auth state and status types.
  - `StateStore.ts` – tiny observable store for auth state.
  - `OidcAuthService.ts` – wraps `oidc-client-ts` and manages lifecycle + token refresh.
  - `authService.ts` – singleton instance of `OidcAuthService`.
  - `AuthProvider.tsx` – React context and `useAuth()` hook.
  - `AuthCards.tsx` – `AuthGate`, loading/error/unauthenticated cards.

- `src/app/_schemas/*`  
  Shared Zod schemas:
  - `userFormSchema.ts` – user form validation.
  - `contactQuerySchema.ts` – contact search validation (includes “at least one field” rule).

- `src/app/_components/*`  
  Reusable UI pieces:
  - `LoadingBackdrop.tsx` – form submission backdrop with spinner + text.
  - `DataTableSkeleton.tsx` – DataGrid-style skeleton loader.
  - `CountrySelect.tsx` – reusable country dropdown (`Select…` or `Any`).
  - `StockAutocomplete.tsx` – stock picker autocomplete wired to shared data.

- `src/app/_data/*`  
  Dummy data and constants:
  - `users.ts` – US stock list used by `StockAutocomplete`.
  - `contacts.ts` – contact records used by `/api/contacts` and contacts page.

- `src/app/users/page.tsx`  
  Users form page, wrapped with `AuthGate`.

- `src/app/contacts/page.tsx`  
  Contacts query page, also wrapped with `AuthGate`.

- `src/app/api/users/route.ts` and `src/app/api/contacts/route.ts`  
  Dummy API endpoints for form submissions and contact search.
  - `contacts/route.ts` implements server-side caching using Next.js `unstable_cache` with automatic periodic refresh (60 seconds) and includes `refreshed_at` timestamps in responses.

- `src/app/sitemap.ts` and `src/app/site-map/page.tsx`  
  - `sitemap.ts` – dynamic **XML sitemap** (`/sitemap.xml`) for crawlers.
  - `site-map/page.tsx` – human-readable HTML sitemap (`/site-map`) linked from the footer.

---

## Running Keycloak for local testing (optional)

A helper `docker-compose.keycloak.yml` and `start_keycloak.sh` are provided (mirroring the Vite example) to run Keycloak on `http://localhost:9090`.  
For full Keycloak setup details (realm, client, and PKCE config), you can refer to the more detailed guide in the `vite-test/README.md`.

