import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const auditLogTable = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey(),
    actorUserId: uuid('actor_user_id'),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    emergencyId: uuid('emergency_id'),
    method: text('method').notNull(),
    path: text('path').notNull(),
    statusCode: integer('status_code').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('audit_log_emergency_id_idx').on(t.emergencyId),
    index('audit_log_created_at_idx').on(t.createdAt),
  ],
);
