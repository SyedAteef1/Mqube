import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/tileflowsys";

export const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});
