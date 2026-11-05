import { createMigratedDatabase, DEFAULT_DATABASE_PATH } from "./client.ts";
import type { AppDatabase } from "./client.ts";

type GlobalWithDatabase = typeof globalThis & { financesDatabase?: AppDatabase };

const getDatabase = (): AppDatabase => {
  const scope: GlobalWithDatabase = globalThis;
  scope.financesDatabase ??= createMigratedDatabase(
    process.env["DATABASE_PATH"] ?? DEFAULT_DATABASE_PATH,
  );
  return scope.financesDatabase;
};

export { getDatabase };
