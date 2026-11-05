import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema.ts";

const DEFAULT_DATABASE_PATH = "data/finances.db";

const createDatabase = (path: string) => {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
};

type AppDatabase = ReturnType<typeof createDatabase>;

const MIGRATIONS_FOLDER = "drizzle";

const migrateDatabase = (database: AppDatabase, migrationsFolder: string = MIGRATIONS_FOLDER): void => {
  const sqlite = database.$client;
  sqlite.pragma("foreign_keys = OFF");
  try {
    migrate(database, { migrationsFolder });
    const violations = sqlite.pragma("foreign_key_check");
    if (Array.isArray(violations) && violations.length > 0) {
      throw new Error(`Migration left ${violations.length} foreign key violations`);
    }
  } finally {
    sqlite.pragma("foreign_keys = ON");
  }
};

const createMigratedDatabase = (path: string): AppDatabase => {
  const database = createDatabase(path);
  migrateDatabase(database);
  return database;
};

export { createDatabase, createMigratedDatabase, DEFAULT_DATABASE_PATH, migrateDatabase };
export type { AppDatabase };
