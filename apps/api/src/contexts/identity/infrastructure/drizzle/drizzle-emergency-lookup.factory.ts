import { eq } from 'drizzle-orm';
import { PgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core';
import { Db } from '../../../../shared/db';

/**
 * Shared query helper used by every DrizzleXxxEmergencyLookup implementation.
 *
 * Each concrete lookup class calls this function with its own table reference
 * so the query body is defined once instead of six times.
 */
export async function findEmergencyIdByEntity(
  db: Db,
  table: PgTable<TableConfig>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  idCol: PgColumn<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emergencyIdCol: PgColumn<any>,
  entityId: string,
): Promise<string | null> {
  const rows = await db
    .select({ emergencyId: emergencyIdCol })
    .from(table)
    .where(eq(idCol, entityId))
    .limit(1);
  return (rows[0]?.emergencyId as string | undefined) ?? null;
}
