import { and, eq, isNull, or } from 'drizzle-orm';
import { Db } from './db';
import { OrganizationAccreditationReader } from '../contexts/resources/domain/ports/organization-accreditation-reader';
// Cross-context infra coupling: resources context reads the accreditations table
// to derive the verification level. Kept in the shared adapter so the domain
// port stays framework-free.
import { accreditationsTable } from '../contexts/accreditation/infrastructure/drizzle/schema';

/**
 * Shared Drizzle adapter — checks whether an organization holds an active
 * accreditation covering a given emergency.
 *
 * Used by the resources context to derive the Official verification level
 * without duplicating the query. Registered in ResourcesModule as the concrete
 * implementation of OrganizationAccreditationReader.
 */
export class DrizzleOrganizationAccreditationReader implements OrganizationAccreditationReader {
  constructor(private readonly db: Db) {}

  async isAccredited(
    organizationId: string,
    emergencyId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ id: accreditationsTable.id })
      .from(accreditationsTable)
      .where(
        and(
          eq(accreditationsTable.organizationId, organizationId),
          or(
            isNull(accreditationsTable.scopeEmergencyId),
            eq(accreditationsTable.scopeEmergencyId, emergencyId),
          ),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }
}
