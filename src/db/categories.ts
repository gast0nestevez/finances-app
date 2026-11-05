import { asc, eq } from "drizzle-orm";
import type { AppDatabase } from "./client.ts";
import { categories } from "./schema.ts";

type Category = Readonly<{
  id: number;
  name: string;
}>;

class DuplicateCategoryError extends Error {
  constructor(name: string) {
    super(`Category already exists: ${name}`);
    this.name = "DuplicateCategoryError";
  }
}

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "SQLITE_CONSTRAINT_UNIQUE";

const withDuplicateCheck = <T>(name: string, operation: () => T): T => {
  try {
    return operation();
  } catch (error: unknown) {
    throw isUniqueViolation(error) ? new DuplicateCategoryError(name) : error;
  }
};

const listCategories = (database: AppDatabase): readonly Category[] =>
  database.select().from(categories).orderBy(asc(categories.name)).all();

const addCategory = (database: AppDatabase, name: string): Category =>
  withDuplicateCheck(name, () =>
    database.insert(categories).values({ name }).returning().get(),
  );

const renameCategory = (database: AppDatabase, id: number, name: string): void =>
  withDuplicateCheck(name, () => {
    database.update(categories).set({ name }).where(eq(categories.id, id)).run();
  });

const deleteCategory = (database: AppDatabase, id: number): void => {
  database.delete(categories).where(eq(categories.id, id)).run();
};

export { addCategory, deleteCategory, DuplicateCategoryError, listCategories, renameCategory };
export type { Category };
