import { eq, and } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { organizationsTable, organizationMembersTable } from './schema';
import { OrganizationMemberRepository } from '../../domain/ports/organization-member.repository';
import { Organization, OrganizationSnapshot } from '../../domain/organization';

type OrgRow = typeof organizationsTable.$inferSelect;

function rowToSnapshot(row: OrgRow): OrganizationSnapshot {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    taxId: row.taxId,
    contactEmail: row.contactEmail,
    verificationLevel: row.verificationLevel,
    createdAt: row.createdAt,
  };
}

export class DrizzleOrganizationMemberRepository implements OrganizationMemberRepository {
  constructor(private readonly db: Db) {}

  async add(organizationId: string, userId: string): Promise<void> {
    await this.db
      .insert(organizationMembersTable)
      .values({ organizationId, userId })
      .onConflictDoNothing();
  }

  async listOrganizationsOfUser(userId: string): Promise<Organization[]> {
    const rows = await this.db
      .select({ org: organizationsTable })
      .from(organizationMembersTable)
      .innerJoin(organizationsTable, eq(organizationMembersTable.organizationId, organizationsTable.id))
      .where(eq(organizationMembersTable.userId, userId));
    return rows.map((r) => Organization.fromSnapshot(rowToSnapshot(r.org)));
  }

  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.organizationId, organizationId),
          eq(organizationMembersTable.userId, userId),
        ),
      );
    return rows.length > 0;
  }
}
