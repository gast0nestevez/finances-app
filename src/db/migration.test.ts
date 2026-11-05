import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDatabase, migrateDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";

type Journal = Readonly<{ entries: readonly Readonly<{ idx: number; tag: string }>[] }> &
  Readonly<Record<string, unknown>>;

let workDirectory: string;
let database: AppDatabase;

const buildFolderWithFirstMigrationOnly = (): string => {
  const folder = join(workDirectory, "legacy-migrations");
  mkdirSync(join(folder, "meta"), { recursive: true });
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as Journal;
  const first = journal.entries[0];
  if (first === undefined) {
    throw new Error("Journal has no entries");
  }
  writeFileSync(join(folder, "meta", "_journal.json"), JSON.stringify({ ...journal, entries: [first] }));
  copyFileSync(`drizzle/${first.tag}.sql`, join(folder, `${first.tag}.sql`));
  return folder;
};

beforeEach(() => {
  workDirectory = mkdtempSync(join(tmpdir(), "finances-migration-"));
  database = createDatabase(":memory:");
  migrateDatabase(database, buildFolderWithFirstMigrationOnly());
});

afterEach(() => {
  database.$client.close();
  rmSync(workDirectory, { recursive: true, force: true });
});

describe("migration from unversioned fixed expenses and investment goal", () => {
  beforeEach(() => {
    const sqlite = database.$client;
    sqlite
      .prepare("INSERT INTO fixed_expenses (id, name, amount_cents, currency, active) VALUES (7, 'Alquiler', 50000000, 'ARS', 1), (9, 'Claude', 2000, 'USD', 0)")
      .run();
    sqlite.prepare("INSERT INTO investment_goal (id, amount_cents, currency) VALUES (1, 50000, 'USD')").run();
    sqlite.prepare("INSERT INTO income (month, amount_cents) VALUES ('2026-10', 200000000)").run();
    sqlite.prepare("INSERT INTO categories (name) VALUES ('Comida')").run();
    sqlite
      .prepare("INSERT INTO expenses (date, description, amount_cents, currency, category_id, rate_at_registration) VALUES ('2026-10-04', 'Almuerzo', 1250000, 'ARS', 1, 1500)")
      .run();
    migrateDatabase(database);
  });

  it("keeps every fixed expense with its id, values and active flag", () => {
    const versions = database.$client
      .prepare("SELECT fixed_expense_id AS id, from_month AS month, name, amount_cents AS amount, currency, active FROM fixed_expense_versions ORDER BY fixed_expense_id")
      .all();
    expect(versions).toEqual([
      { id: 7, month: "0001-01", name: "Alquiler", amount: 50_000_000, currency: "ARS", active: 1 },
      { id: 9, month: "0001-01", name: "Claude", amount: 2_000, currency: "USD", active: 0 },
    ]);
    expect(database.$client.prepare("SELECT id FROM fixed_expenses ORDER BY id").all()).toEqual([{ id: 7 }, { id: 9 }]);
  });

  it("turns the single investment goal into a goal valid since the beginning", () => {
    expect(database.$client.prepare("SELECT month, amount_cents AS amount, currency FROM investment_goals").all()).toEqual([
      { month: "0001-01", amount: 50_000, currency: "USD" },
    ]);
  });

  it("removes the old unversioned structures", () => {
    const tables = database.$client.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
    expect(tables).not.toContainEqual({ name: "investment_goal" });
    const columns = database.$client.prepare("PRAGMA table_info(fixed_expenses)").all();
    expect(columns).toHaveLength(1);
  });

  it("leaves the rest of the data untouched", () => {
    expect(database.$client.prepare("SELECT month, amount_cents AS amount FROM income").all()).toEqual([
      { month: "2026-10", amount: 200_000_000 },
    ]);
    expect(database.$client.prepare("SELECT description, category_id AS category FROM expenses").all()).toEqual([
      { description: "Almuerzo", category: 1 },
    ]);
  });

  it("restores foreign key enforcement after migrating", () => {
    expect(database.$client.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(database.$client.pragma("foreign_key_check")).toEqual([]);
  });
});
