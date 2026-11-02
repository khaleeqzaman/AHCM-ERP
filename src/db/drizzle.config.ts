import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL;

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;

const isSupabaseOrRemote =
  (connectionString && (connectionString.includes('supabase') || connectionString.includes('sslmode=require'))) ||
  (sqlHost && sqlHost.includes('supabase'));

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: connectionString
    ? {
        url: connectionString,
        ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: sqlHost || "127.0.0.1",
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: user || "postgres",
        password: password || "",
        database: sqlDbName || "postgres",
        ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
});
