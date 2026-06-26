import { eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { ResourceEmergencyLookup } from '../../domain/ports/resource-emergency-lookup';
// Cross-context infra coupling: identity reads the resources table only for authorization.
// The dependency is intentional and documented in the port interface.
import { resourcesTable } from '../../../resources/infrastructure/drizzle/schema';

export class DrizzleResourceEmergencyLookup implements ResourceEmergencyLookup {
  constructor(private readonly db: Db) {}

  async findEmergencyId(resourceId: string): Promise<string | null> {
    const rows = await this.db
      .select({ emergencyId: resourcesTable.emergencyId })
      .from(resourcesTable)
      .where(eq(resourcesTable.id, resourceId))
      .limit(1);
    return rows[0]?.emergencyId ?? null;
  }
}
