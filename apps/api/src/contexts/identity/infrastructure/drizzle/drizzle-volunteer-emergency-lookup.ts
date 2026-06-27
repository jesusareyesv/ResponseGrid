import { Db } from '../../../../shared/db';
import { VolunteerEmergencyLookup } from '../../domain/ports/volunteer-emergency-lookup';
// Cross-context infra coupling: identity reads the volunteers table only for authorization.
// The dependency is intentional and documented in the port interface.
import { volunteersTable } from '../../../volunteers/infrastructure/drizzle/schema';
import { findEmergencyIdByEntity } from './drizzle-emergency-lookup.factory';

export class DrizzleVolunteerEmergencyLookup implements VolunteerEmergencyLookup {
  constructor(private readonly db: Db) {}

  findEmergencyId(volunteerId: string): Promise<string | null> {
    return findEmergencyIdByEntity(
      this.db,
      volunteersTable,
      volunteersTable.id,
      volunteersTable.emergencyId,
      volunteerId,
    );
  }
}
