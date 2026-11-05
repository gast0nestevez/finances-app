import Database from "better-sqlite3";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { backupFileName, createBackup } from "./backup.ts";
import { createMigratedDatabase } from "./client.ts";
import { addCategory } from "./categories.ts";

let workDirectory: string;

beforeEach(() => {
  workDirectory = mkdtempSync(join(tmpdir(), "finances-backup-"));
});

afterEach(() => {
  rmSync(workDirectory, { recursive: true, force: true });
});

describe("backupFileName", () => {
  it("formats the local timestamp with zero padding", () => {
    expect(backupFileName(new Date(2026, 0, 5, 3, 4, 9))).toBe("finances-2026-01-05_030409.db");
  });
});

describe("createBackup", () => {
  it("copies committed data even while the source connection is open in WAL mode", async () => {
    const sourcePath = join(workDirectory, "finances.db");
    const database = createMigratedDatabase(sourcePath);
    addCategory(database, "Food");

    const backupPath = await createBackup(sourcePath, join(workDirectory, "backups"), new Date(2026, 10, 4, 12, 0, 0));

    expect(backupPath.endsWith("finances-2026-11-04_120000.db")).toBe(true);
    const restored = new Database(backupPath, { readonly: true });
    expect(restored.prepare("SELECT name FROM categories").all()).toEqual([{ name: "Food" }]);
    restored.close();
    database.$client.close();
  });

  it("creates the backup directory when missing", async () => {
    const sourcePath = join(workDirectory, "finances.db");
    createMigratedDatabase(sourcePath).$client.close();
    const directory = join(workDirectory, "nested", "backups");
    await createBackup(sourcePath, directory);
    expect(existsSync(directory)).toBe(true);
  });

  it("fails when the source database does not exist", async () => {
    await expect(createBackup(join(workDirectory, "missing.db"), join(workDirectory, "backups"))).rejects.toThrow();
  });
});
