import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDatabase, DEFAULT_DATABASE_PATH } from "./client.ts";

const database = createDatabase(process.env["DATABASE_PATH"] ?? DEFAULT_DATABASE_PATH);
migrate(database, { migrationsFolder: "drizzle" });
