import { beforeEach, describe, expect, it } from "vitest";
import {
  addCategory,
  deleteCategory,
  DuplicateCategoryError,
  listCategories,
  renameCategory,
} from "./categories.ts";
import { createMigratedDatabase } from "./client.ts";
import type { AppDatabase } from "./client.ts";

let database: AppDatabase;

beforeEach(() => {
  database = createMigratedDatabase(":memory:");
});

describe("categories repository", () => {
  it("lists categories sorted by name", () => {
    addCategory(database, "Transport");
    addCategory(database, "Food");
    expect(listCategories(database).map((category) => category.name)).toEqual(["Food", "Transport"]);
  });

  it("rejects duplicated names on add", () => {
    addCategory(database, "Food");
    expect(() => addCategory(database, "Food")).toThrow(DuplicateCategoryError);
  });

  it("renames a category", () => {
    const category = addCategory(database, "Food");
    renameCategory(database, category.id, "Groceries");
    expect(listCategories(database)).toEqual([{ id: category.id, name: "Groceries" }]);
  });

  it("rejects renaming into an existing name", () => {
    addCategory(database, "Food");
    const other = addCategory(database, "Fun");
    expect(() => renameCategory(database, other.id, "Food")).toThrow(DuplicateCategoryError);
  });

  it("deletes a category", () => {
    const category = addCategory(database, "Food");
    deleteCategory(database, category.id);
    expect(listCategories(database)).toEqual([]);
  });
});
