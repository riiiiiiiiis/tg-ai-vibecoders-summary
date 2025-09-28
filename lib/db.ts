import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

export function getPool(): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL env variable is required for database access.");
  }

  if (!global.__pgPool) {
    global.__pgPool = new Pool({ connectionString: databaseUrl, max: 5 });
  }

  return global.__pgPool;
}

export async function withConnection<T>(handler: (client: Pool) => Promise<T>): Promise<T> {
  const pool = getPool();
  return handler(pool);
}
