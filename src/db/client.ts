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

const createMigratedDatabase = (path: string): AppDatabase => {
  const database = createDatabase(path);
  migrate(database, { migrationsFolder: "drizzle" });
  return database;
};

export { createDatabase, createMigratedDatabase, DEFAULT_DATABASE_PATH };
export type { AppDatabase };
