import { Db } from '../../../../shared/db';
import { NeedEmergencyLookup } from '../../domain/ports/need-emergency-lookup';
// Cross-context infra coupling: identity reads the needs table only for authorization.
// The dependency is intentional and documented in the port interface.
import { needsTable } from '../../../needs/infrastructure/drizzle/schema';
import { findEmergencyIdByEntity } from './drizzle-emergency-lookup.factory';

export class DrizzleNeedEmergencyLookup implements NeedEmergencyLookup {
  constructor(private readonly db: Db) {}

  findEmergencyId(needId: string): Promise<string | null> {
    return findEmergencyIdByEntity(
      this.db,
      needsTable,
      needsTable.id,
      needsTable.emergencyId,
      needId,
    );
  }
}
