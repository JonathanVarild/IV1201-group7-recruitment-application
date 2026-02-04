import { Pool, type PoolClient } from "pg";

// Create PostgreSQL connection pool.
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Function to get a static database client, which can be used for transactions, etc.
 *
 * @returns A static database client from the connection pool.
 */
export async function getDatabaseClient(): Promise<PoolClient> {
  return await pool.connect();
}
