import { eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { NeedEmergencyLookup } from '../../domain/ports/need-emergency-lookup';
// Cross-context infra coupling: identity reads the needs table only for authorization.
// The dependency is intentional and documented in the port interface.
import { needsTable } from '../../../needs/infrastructure/drizzle/schema';

export class DrizzleNeedEmergencyLookup implements NeedEmergencyLookup {
  constructor(private readonly db: Db) {}

  async findEmergencyId(needId: string): Promise<string | null> {
    const rows = await this.db
      .select({ emergencyId: needsTable.emergencyId })
      .from(needsTable)
      .where(eq(needsTable.id, needId))
      .limit(1);
    return rows[0]?.emergencyId ?? null;
  }
}
