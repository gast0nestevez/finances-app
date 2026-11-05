import { DEFAULT_DATABASE_PATH } from "./client.ts";
import { createBackup, DEFAULT_BACKUP_DIRECTORY } from "./backup.ts";

const destination = await createBackup(
  process.env["DATABASE_PATH"] ?? DEFAULT_DATABASE_PATH,
  process.env["BACKUP_DIR"] ?? DEFAULT_BACKUP_DIRECTORY,
);

console.log(`Backup created at ${destination}`);
