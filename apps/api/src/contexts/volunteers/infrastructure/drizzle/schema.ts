import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const volunteersTable = pgTable(
  'volunteers',
  {
    id: uuid('id').primaryKey(),
    emergencyId: uuid('emergency_id').notNull(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    contact: text('contact').notNull(),
    municipality: text('municipality').notNull(),
    skills: text('skills').array().notNull().default([]),
    availability: text('availability').notNull(),
    vehicle: text('vehicle').notNull(),
    status: text('status').notNull(),
    consentAccepted: boolean('consent_accepted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    uniqueUserEmergency: unique('volunteers_user_emergency_uniq').on(
      t.emergencyId,
      t.userId,
    ),
  }),
);
