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
- `NEXT_PUBLIC_KEYCLOAK_URL` – base URL of your Keycloak server (e.g. `http://localhost:9090`).
- `NEXT_PUBLIC_KEYCLOAK_REALM` – realm name.
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` – public SPA client ID configured for PKCE.
- `NEXT_PUBLIC_KEYCLOAK_ONLOAD` – `login-required` or `check-sso` (defaults to `check-sso`).

Example `.env.local`:

```env
NEXT_PUBLIC_AUTH_ENABLED=false

# When you want to enable auth:
# NEXT_PUBLIC_AUTH_ENABLED=true
# NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:9090
# NEXT_PUBLIC_KEYCLOAK_REALM=vite-test
# NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=vite-spa
# NEXT_PUBLIC_KEYCLOAK_ONLOAD=check-sso
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
      - “At least one criterion” enforced in the schema.
    - Calls `/api/contacts` (dummy data), applies client-side filtering, and displays results in a **MUI DataGrid**.
    - Shows a **DataGrid-based skeleton** while loading, with no preloaded data before first search.

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
  - `KeycloakAuthService.ts` – wraps `keycloak-js` and manages lifecycle + token refresh.
  - `authService.ts` – singleton instance of `KeycloakAuthService`.
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

- `src/app/sitemap.ts` and `src/app/site-map/page.tsx`  
  - `sitemap.ts` – dynamic **XML sitemap** (`/sitemap.xml`) for crawlers.
  - `site-map/page.tsx` – human-readable HTML sitemap (`/site-map`) linked from the footer.

---

## Running Keycloak for local testing (optional)

A helper `docker-compose.keycloak.yml` and `start_keycloak.sh` are provided (mirroring the Vite example) to run Keycloak on `http://localhost:9090`.  
For full Keycloak setup details (realm, client, and PKCE config), you can refer to the more detailed guide in the `vite-test/README.md`.

