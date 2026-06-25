import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const resourcesTable = pgTable('resources', {
  id: uuid('id').primaryKey(),
  emergencyId: uuid('emergency_id').notNull(),
  type: text('type').notNull(),
  side: text('side').notNull(),
  name: text('name').notNull(),
  verificationLevel: text('verification_level').notNull(),
  publicStatus: text('public_status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
