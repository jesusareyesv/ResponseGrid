import { AuthProvider } from './auth-provider';

export interface UserIdentityProps {
  provider: AuthProvider;
  providerUserId: string;
}

export class UserIdentity {
  private constructor(
    public readonly provider: AuthProvider,
    public readonly providerUserId: string,
  ) {}

  static create(props: UserIdentityProps): UserIdentity {
    if (!props.providerUserId || props.providerUserId.trim() === '') {
      throw new Error('providerUserId must not be empty');
    }
    return new UserIdentity(props.provider, props.providerUserId.trim());
  }
}
