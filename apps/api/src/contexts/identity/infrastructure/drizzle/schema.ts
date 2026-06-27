import { pgTable, uuid, text, boolean, unique } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  /** Nullable: social-only accounts have no password */
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
});

export const membershipsTable = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    /** NOTE: no FK to emergencies.id — e2e tests insert memberships with
     *  emergency UUIDs that may not exist in the emergencies table. */
    emergencyId: uuid('emergency_id').notNull(),
    role: text('role').notNull(),
  },
  (t) => [
    // One role per user per emergency — the upsert key is (user_id, emergency_id)
    // so that updating a role replaces the existing row rather than inserting a new one.
    unique('memberships_user_emergency_unique').on(t.userId, t.emergencyId),
  ],
);

export const userIdentitiesTable = pgTable(
  'user_identities',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    /** OAuth provider: 'google' | 'facebook' */
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
  },
  (t) => [
    unique('user_identities_provider_provider_user_id_unique').on(
      t.provider,
      t.providerUserId,
    ),
  ],
);
