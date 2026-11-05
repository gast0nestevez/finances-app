import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_BACKUP_DIRECTORY = "data/backups";

const pad = (value: number): string => String(value).padStart(2, "0");

const backupFileName = (now: Date): string =>
  `finances-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.db`;

const createBackup = async (
  sourcePath: string,
  backupDirectory: string,
  now: Date = new Date(),
): Promise<string> => {
  mkdirSync(backupDirectory, { recursive: true });
  const destination = join(backupDirectory, backupFileName(now));
  const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try {
    await source.backup(destination);
  } finally {
    source.close();
  }
  return destination;
};

export { backupFileName, createBackup, DEFAULT_BACKUP_DIRECTORY };
