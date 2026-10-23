# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root (Turbo orchestrates the workspaces):

```bash
yarn dev            # Start all apps in dev (Next.js with --turbopack)
yarn build          # Production build of all apps
yarn start          # Start production servers
yarn lint           # Lint all packages
yarn lint:fix       # eslint . --fix
yarn format         # prettier --write across the repo
yarn check-types    # Type-check via turbo

# Database (Drizzle + Neon Postgres) — all read DATABASE_URL via dotenv-cli
yarn db:generate    # Generate SQL migrations from schema changes
yarn db:migrate     # Apply migrations
yarn db:push        # Push schema directly (dev only)
yarn db:studio      # Open Drizzle Studio
```

There is **no test runner** configured in this repo — do not assume `yarn test` exists.

### First-time setup gotcha

Environment variables live in a single root `.env`. Run `yarn sys-link` to symlink it into each app under `apps/*` (see `env-links.sh`). The dev server will fail env validation without this step. Env is validated by Zod via `@t3-oss/env-nextjs` in `packages/utilities/src/env`; add new vars there **and** to `turbo.json`'s `build.env` list if they're needed at build time.

## Architecture

Yarn 4 workspaces + Turborepo monorepo:

- `apps/web` — the Next.js 15 App Router application (the only app)
- `packages/db` — Drizzle ORM schema, migrations, and the Neon Postgres client (`@invoicely/db`)
- `packages/utilities` — shared env config (`@invoicely/utilities`)
- `packages/eslint-config`, `packages/typescript-config` — shared config

Path aliases in `apps/web`: `@/*` → `src/*`, `@/icons` → `src/assets/icons`.

### Authenticated server data

Dashboard routes require a Better Auth session and redirect signed-out users to `/sign-in` with a sanitized internal callback URL. React Server Components read invoices, saved defaults, and R2 asset keys directly. Client components receive serializable DTOs; convert Drizzle `Decimal` values and dates at the server boundary.

Mutations live in `apps/web/src/actions`. Every Server Action must independently validate the current session and its Zod input, enforce row or key ownership, report unexpected errors to Sentry, and return the shared serializable `ActionResult<T>` union. Revalidate affected paths after successful writes and refresh or navigate from the client.

Postgres is the only invoice store. Cloudflare R2 is the only logo/signature store. Saved sender/client defaults live in the one-to-one `invoice_defaults` table keyed by user ID.

### Database schema (heavily normalized)

`packages/db/src/schema/invoice.ts`: an `invoices` row owns one `invoiceFields` row, which fans out into `invoiceCompanyDetails`, `invoiceClientDetails`, `invoiceDetails`, `invoiceMetadata`, and many `invoiceItems` — each with their own child metadata tables. `lib/db-queries/invoice/insertInvoice.ts` preserves the required sequential insert order inside a transaction; keep aggregate creates and replacements atomic when extending it.

Money/amounts use **Decimal.js** end to end via the custom Drizzle `Numeric` type in `packages/db/src/custom/decimal.ts` (stores `numeric`, hydrates to `Decimal`). Never use JS floats for monetary values.

Auth uses **Better Auth** with the Drizzle adapter and Google OAuth (`lib/auth.ts` server / `lib/client-auth.ts` client). Custom model names (`users`/`accounts`/`sessions`/`verifications`) and `generateId: false` (the app supplies UUIDs). Route handler at `app/api/auth/[...all]/route.ts`.

### PDF generation

Invoices render to PDF with `@react-pdf/renderer` / `react-pdf`. PDF components live in `components/pdf`; `lib/invoice` holds base64/blob/image conversion helpers; `providers/pdf-worker-provider.tsx` sets up the worker. Templates are keyed by name (`default`, `vercel`) in the invoice theme.

### Marketing / blog

Uses `fumadocs-ui` + `content-collections` (MDX). Content sources are in `apps/web/src/content`, configured in `apps/web/content-collections.ts`.

## Conventions (enforced by review — see `.cursor/rules` and README)

- **No default exports.** Declare then export: `const Foo = () => {}; export { Foo }`.
- Client components (`"use client"`) get a `.client.tsx` filename suffix.
- Zod schemas/types are prefixed `Zod` (e.g. `ZodCreateInvoiceSchema`); the schema object itself is `createInvoiceSchema`.
- Directories use `lowercase-with-dashes`. Use the `function` keyword for pure functions; prefer interfaces over types; avoid enums (use maps / `pgEnum`).
- Favor React Server Components; minimize `use client`, `useEffect`, `setState`.
- Commit/PR title format: `type(scope): description` (`feat:`, `fix:`, `chore:`). Branch names: `profilename/featurename`.
- The Husky pre-commit hook runs `turbo run lint -- --fix` then `yarn format`.

## Important constraints

- **Do not push or commit database migrations** — migrations are reviewed and managed by maintainers (per README).
- The project rejects low-quality / "vibe coded" PRs — keep changes deliberate and consistent with existing patterns.
