import { defineConfig } from "drizzle-kit";

const config = defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: "./data/finances.db" },
});

export default config;
