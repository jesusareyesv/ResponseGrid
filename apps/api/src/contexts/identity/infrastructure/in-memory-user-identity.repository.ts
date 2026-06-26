import { UserIdentityRepository } from '../domain/ports/user-identity.repository';
import { AuthProvider } from '../domain/auth-provider';
import { UserIdentity } from '../domain/user-identity';
import { UserId } from '../domain/user-id';

interface StoredLink {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
}

export class InMemoryUserIdentityRepository implements UserIdentityRepository {
  private store: StoredLink[] = [];

  async findByProvider(provider: AuthProvider, providerUserId: string): Promise<UserId | null> {
    const link = this.store.find(
      (l) => l.provider === provider && l.providerUserId === providerUserId,
    );
    return link ? UserId.fromString(link.userId) : null;
  }

  async link(userId: UserId, identity: UserIdentity): Promise<void> {
    // Idempotent: replace if already linked
    this.store = this.store.filter(
      (l) => !(l.provider === identity.provider && l.providerUserId === identity.providerUserId),
    );
    this.store.push({
      userId: userId.value,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
    });
  }
}
