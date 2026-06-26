import { eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { VolunteerEmergencyLookup } from '../../domain/ports/volunteer-emergency-lookup';
// Cross-context infra coupling: identity reads the volunteers table only for authorization.
// The dependency is intentional and documented in the port interface.
import { volunteersTable } from '../../../volunteers/infrastructure/drizzle/schema';

export class DrizzleVolunteerEmergencyLookup implements VolunteerEmergencyLookup {
  constructor(private readonly db: Db) {}

  async findEmergencyId(volunteerId: string): Promise<string | null> {
    const rows = await this.db
      .select({ emergencyId: volunteersTable.emergencyId })
      .from(volunteersTable)
      .where(eq(volunteersTable.id, volunteerId))
      .limit(1);
    return rows[0]?.emergencyId ?? null;
  }
}
