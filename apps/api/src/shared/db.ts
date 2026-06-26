import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Db = NodePgDatabase;

/** Creates a new Pool from a connection string (used by integration specs and seeds). */
export function createDb(urlOrPool: string): { db: Db; pool: Pool };
/** Wraps an existing Pool into a Drizzle instance (used by DatabaseModule). */
export function createDb(urlOrPool: Pool): { db: Db };
export function createDb(urlOrPool: string | Pool): { db: Db; pool?: Pool } {
  if (typeof urlOrPool === 'string') {
    const pool = new Pool({ connectionString: urlOrPool });
    return { db: drizzle(pool), pool };
  }
  return { db: drizzle(urlOrPool) };
}
