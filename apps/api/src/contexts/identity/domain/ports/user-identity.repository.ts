import { AuthProvider } from '../auth-provider';
import { UserIdentity } from '../user-identity';
import { UserId } from '../user-id';

export const USER_IDENTITY_REPOSITORY = Symbol('UserIdentityRepository');

export interface UserIdentityRepository {
  /**
   * Returns the UserId associated with a given provider + providerUserId, or null if not found.
   */
  findByProvider(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<UserId | null>;

  /**
   * Links a social identity to an existing user account.
   */
  link(userId: UserId, identity: UserIdentity): Promise<void>;
}
