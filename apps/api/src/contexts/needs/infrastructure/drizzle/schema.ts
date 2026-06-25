import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const needsTable = pgTable('needs', {
  id: uuid('id').primaryKey(),
  emergencyId: uuid('emergency_id').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull(),
  requestedQuantity: integer('requested_quantity'),
  unit: text('unit'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
