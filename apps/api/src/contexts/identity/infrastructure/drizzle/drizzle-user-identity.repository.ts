import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { Db } from '../../../../shared/db';
import { userIdentitiesTable } from './schema';
import { UserIdentityRepository } from '../../domain/ports/user-identity.repository';
import { AuthProvider } from '../../domain/auth-provider';
import { UserIdentity } from '../../domain/user-identity';
import { UserId } from '../../domain/user-id';

export class DrizzleUserIdentityRepository implements UserIdentityRepository {
  constructor(private readonly db: Db) {}

  async findByProvider(provider: AuthProvider, providerUserId: string): Promise<UserId | null> {
    const rows = await this.db
      .select()
      .from(userIdentitiesTable)
      .where(
        and(
          eq(userIdentitiesTable.provider, provider),
          eq(userIdentitiesTable.providerUserId, providerUserId),
        ),
      );
    return rows[0] ? UserId.fromString(rows[0].userId) : null;
  }

  async link(userId: UserId, identity: UserIdentity): Promise<void> {
    await this.db
      .insert(userIdentitiesTable)
      .values({
        id: randomUUID(),
        userId: userId.value,
        provider: identity.provider,
        providerUserId: identity.providerUserId,
      })
      .onConflictDoNothing();
  }
}
