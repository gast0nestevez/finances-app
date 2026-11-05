import { createMigratedDatabase, DEFAULT_DATABASE_PATH } from "./client.ts";

createMigratedDatabase(process.env["DATABASE_PATH"] ?? DEFAULT_DATABASE_PATH);
