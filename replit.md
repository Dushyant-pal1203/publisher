# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run generate` — generate a new SQL migration after editing the schema
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Auto-migration on first run (client deployment)

The API server runs Drizzle migrations automatically at startup, before binding the HTTP port. If the target database is empty, all tables are created on the first launch — the client does not need to run any setup script.

- Migration SQL files live in `lib/db/drizzle/` and are committed to the repo.
- `lib/db/src/migrate.ts` exports `runMigrations()`, called from `artifacts/api-server/src/index.ts` before `app.listen()`.
- `artifacts/api-server/build.mjs` copies `lib/db/drizzle/` into `artifacts/api-server/dist/drizzle/` so the bundled server can find them at runtime.
- The migrator records applied migrations in `drizzle.__drizzle_migrations`; reruns are no-ops on already-migrated databases.
- For the client's Hostinger deployment, set `DATABASE_URL=postgresql://postgres:Aditya%401203@localhost:5432/publisher` (URL-encoded `@` in the password) and `SESSION_SECRET` in their environment, then start the server — tables are created automatically.
- Whenever the schema changes, run `pnpm --filter @workspace/db run generate` to add a new migration file and commit it.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
