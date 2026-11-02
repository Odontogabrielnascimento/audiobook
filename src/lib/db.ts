import "server-only";
import { Pool, type QueryResultRow } from "pg";

declare global {
  var __pgPool: Pool | undefined;
}

// Reaproveita a conexao entre recarregamentos em desenvolvimento
const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
if (process.env.NODE_ENV !== "production") globalThis.__pgPool = pool;

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export { pool };
