import { Db } from '../../../../shared/db';
import { ResourceEmergencyLookup } from '../../domain/ports/resource-emergency-lookup';
// Cross-context infra coupling: identity reads the resources table only for authorization.
// The dependency is intentional and documented in the port interface.
import { resourcesTable } from '../../../resources/infrastructure/drizzle/schema';
import { findEmergencyIdByEntity } from './drizzle-emergency-lookup.factory';

export class DrizzleResourceEmergencyLookup implements ResourceEmergencyLookup {
  constructor(private readonly db: Db) {}

  findEmergencyId(resourceId: string): Promise<string | null> {
    return findEmergencyIdByEntity(
      this.db,
      resourcesTable,
      resourcesTable.id,
      resourcesTable.emergencyId,
      resourceId,
    );
  }
}
