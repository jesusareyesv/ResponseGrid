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
    userId: uuid('user_id').notNull(),
    emergencyId: uuid('emergency_id').notNull(),
    role: text('role').notNull(),
  },
  (t) => [unique('memberships_user_emergency_role_unique').on(t.userId, t.emergencyId, t.role)],
);

export const userIdentitiesTable = pgTable(
  'user_identities',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    /** OAuth provider: 'google' | 'facebook' */
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
  },
  (t) => [unique('user_identities_provider_provider_user_id_unique').on(t.provider, t.providerUserId)],
);
