import { Db } from '../../../../shared/db';
import { OfferEmergencyLookup } from '../../domain/ports/offer-emergency-lookup';
// Cross-context infra coupling: identity reads the offers table only for authorization.
// The dependency is intentional and documented in the port interface.
import { offersTable } from '../../../offers/infrastructure/drizzle/schema';
import { findEmergencyIdByEntity } from './drizzle-emergency-lookup.factory';

export class DrizzleOfferEmergencyLookup implements OfferEmergencyLookup {
  constructor(private readonly db: Db) {}

  findEmergencyId(offerId: string): Promise<string | null> {
    return findEmergencyIdByEntity(
      this.db,
      offersTable,
      offersTable.id,
      offersTable.emergencyId,
      offerId,
    );
  }
}
