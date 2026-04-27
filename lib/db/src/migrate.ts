import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

function resolveMigrationsFolder(): string {
  if (process.env.DRIZZLE_MIGRATIONS_FOLDER) {
    return process.env.DRIZZLE_MIGRATIONS_FOLDER;
  }

  const candidates: string[] = [];

  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(path.resolve(here, "../drizzle"));
    candidates.push(path.resolve(here, "../../drizzle"));
    candidates.push(path.resolve(here, "./drizzle"));
  } catch {
    // import.meta.url may not be available; fall through
  }

  candidates.push(path.resolve(process.cwd(), "drizzle"));
  candidates.push(path.resolve(process.cwd(), "lib/db/drizzle"));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return candidates[0] ?? path.resolve(process.cwd(), "drizzle");
}

export async function runMigrations(): Promise<void> {
  const migrationsFolder = resolveMigrationsFolder();
  await migrate(db, { migrationsFolder });
}
