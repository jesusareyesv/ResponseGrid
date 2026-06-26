import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
} from 'drizzle-orm/pg-core';

export const resourcesTable = pgTable('resources', {
  id: uuid('id').primaryKey(),
  emergencyId: uuid('emergency_id').notNull(),
  type: text('type').notNull(),
  stage: text('stage').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  ownerUserId: uuid('owner_user_id').notNull(),
  ownerOrganizationId: uuid('owner_organization_id'),
  verificationLevel: text('verification_level').notNull(),
  publicStatus: text('public_status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
