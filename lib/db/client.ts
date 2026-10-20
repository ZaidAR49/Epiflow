import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Global pooled postgres client to avoid connection leak in serverless environments.
 */
const globalForDb = globalThis as unknown as {
  sqlClient: postgres.Sql | undefined;
};

const sql =
  globalForDb.sqlClient ??
  postgres(connectionString ?? "postgresql://localhost:5432/postgres", {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlClient = sql;
}

export const db = drizzle(sql, { schema });
export type Database = typeof db;
