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
    max: 20,
    idle_timeout: 30,
    connect_timeout: 30,
    max_lifetime: 60 * 10,
    keep_alive: 30,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlClient = sql;
}

export const db = drizzle(sql, { schema });
export type Database = typeof db;
