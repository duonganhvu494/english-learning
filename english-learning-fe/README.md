<!-- # English Learning FE

Next.js + Tailwind base with:
- Theme-ready design tokens (light / dark)
- Locale-ready app settings (vi / en)
- Centralized primary color scale (`primary-50` -> `primary-900`)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project structure

```text
src/
  app/                     # Next.js App Router
    login/                 # Login page
  api/
    core/                  # HTTP client + error handling + shared response types
    auth/                  # Auth endpoint definitions and DTO types
  components/
    common/                # Reusable UI building blocks
    layout/                # Layout-level components
    login/                 # Login-specific components
  config/                  # App settings + environment config
  i18n/
    dictionaries/          # Locale dictionaries
    index.ts               # Locale -> dictionary map
    types.ts               # Dictionary typing
  providers/               # App-level context providers
  styles/                  # Tokens, base styles, responsive helpers
```

## Design tokens

Global tokens are in `src/app/globals.css`:
- Surfaces: `background`, `surface`
- Text: `foreground`, `muted`
- Borders: `border`
- Brand: `primary`, `primary-50` ... `primary-900`, `primary-foreground`

Example classes:
- `bg-primary`
- `text-primary`
- `bg-primary-700`
- `border-primary-300`

## Locale + theme state

`src/providers/app-settings-provider.tsx` stores the selected:
- Theme (`light` / `dark`)
- Locale (`vi` / `en`)

Selections are persisted with `localStorage`.

## API to NestJS

- Base URL is configured via `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Reference sample in `.env.example`
- Auth API module:
  - `src/api/auth/auth.api.ts`
  - `src/api/auth/auth.types.ts`
- Shared request layer:
  - `src/api/core/http-client.ts`
  - `src/api/core/api-error.ts`
  - `src/api/core/api-types.ts`

### Quick start

1. Create `.env.local` (or `.env`) in `english-learning-fe`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

2. Login submit example is already wired in:
   - `src/components/login/login-form.tsx`
   - `handleSubmit` calls `authApi.login({ userName, password })` -->
