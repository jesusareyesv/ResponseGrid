import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
// Cross-context infra coupling: we reference the organizations table for the FK.
// This is intentional and the only acceptable schema-level coupling.
import { organizationsTable } from '../../../organizations/infrastructure/drizzle/schema';

export const accreditationsTable = pgTable('accreditations', {
  id: uuid('id').primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  /** NULL means global scope; non-null means scoped to this emergency. */
  scopeEmergencyId: uuid('scope_emergency_id'),
  grantedByUserId: uuid('granted_by_user_id').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull(),
  evidence: text('evidence'),
});
