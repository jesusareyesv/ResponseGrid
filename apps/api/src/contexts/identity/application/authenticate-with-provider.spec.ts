import { AuthenticateWithProvider } from './authenticate-with-provider';
import { InMemoryUserRepository } from '../infrastructure/in-memory-user.repository';
import { InMemoryUserIdentityRepository } from '../infrastructure/in-memory-user-identity.repository';
import { AuthProvider } from '../domain/auth-provider';
import { User } from '../domain/user';
import { UserId } from '../domain/user-id';
import { Email } from '../domain/email';
import type { TokenService, TokenPayload } from '../domain/ports/token.service';

class FakeTokenService implements TokenService {
  sign(payload: TokenPayload): string {
    return `token:${payload.sub}:${payload.email}:${payload.isAdmin}`;
  }
  verify(token: string): TokenPayload {
    const parts = token.split(':');
    return { sub: parts[1], email: parts[2], isAdmin: parts[3] === 'true' };
  }
}

const EXISTING_USER_ID = '33333333-3333-4333-8333-333333333333';

async function buildRepoWithUser(email: string, name = 'Existing User') {
  const userRepo = new InMemoryUserRepository();
  const user = User.create({
    id: UserId.fromString(EXISTING_USER_ID),
    email: Email.fromString(email),
    passwordHash: 'hashed:somepass',
    name,
    isAdmin: false,
  });
  await userRepo.save(user);
  return userRepo;
}

describe('AuthenticateWithProvider', () => {
  const tokenService = new FakeTokenService();

  const cmd = {
    provider: AuthProvider.Google,
    providerUserId: 'google-uid-123',
    email: 'social@example.com',
    name: 'Social User',
  };

  describe('Path 1 — identity already linked', () => {
    it('returns a token for the existing user', async () => {
      const userRepo = await buildRepoWithUser('social@example.com');
      const identityRepo = new InMemoryUserIdentityRepository();
      // pre-link the identity
      await identityRepo.link(UserId.fromString(EXISTING_USER_ID), {
        provider: AuthProvider.Google,
        providerUserId: 'google-uid-123',
      });

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      const result = await useCase.execute(cmd);

      expect(result.accessToken).toContain(EXISTING_USER_ID);
      expect(result.accessToken).toContain('social@example.com');
    });

    it('does not create a second user when identity is already linked', async () => {
      const userRepo = await buildRepoWithUser('social@example.com');
      const identityRepo = new InMemoryUserIdentityRepository();
      await identityRepo.link(UserId.fromString(EXISTING_USER_ID), {
        provider: AuthProvider.Google,
        providerUserId: 'google-uid-123',
      });

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      await useCase.execute(cmd);
      // Only the original user should exist
      const found = await userRepo.findByEmail(
        Email.fromString('social@example.com'),
      );
      expect(found?.id.value).toBe(EXISTING_USER_ID);
    });
  });

  describe('Path 2 — email matches existing account (unify by email)', () => {
    it('links the new identity and returns a token for the existing user', async () => {
      const userRepo = await buildRepoWithUser('social@example.com');
      const identityRepo = new InMemoryUserIdentityRepository();

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      const result = await useCase.execute(cmd);

      expect(result.accessToken).toContain(EXISTING_USER_ID);
    });

    it('stores the linked identity so Path 1 applies on next login', async () => {
      const userRepo = await buildRepoWithUser('social@example.com');
      const identityRepo = new InMemoryUserIdentityRepository();

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      await useCase.execute(cmd);

      const linkedId = await identityRepo.findByProvider(
        AuthProvider.Google,
        'google-uid-123',
      );
      expect(linkedId?.value).toBe(EXISTING_USER_ID);
    });

    it('does not create a new user when email already exists', async () => {
      const userRepo = await buildRepoWithUser('social@example.com');
      const identityRepo = new InMemoryUserIdentityRepository();
      const countBefore = await userRepo.countAll();

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      await useCase.execute(cmd);

      expect(await userRepo.countAll()).toBe(countBefore);
    });
  });

  describe('Path 3 — brand-new user', () => {
    it('creates the user and returns a token', async () => {
      const userRepo = new InMemoryUserRepository();
      const identityRepo = new InMemoryUserIdentityRepository();

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      const result = await useCase.execute(cmd);

      expect(result.accessToken).toContain('social@example.com');
    });

    it('saves the user with null passwordHash (social-only)', async () => {
      const userRepo = new InMemoryUserRepository();
      const identityRepo = new InMemoryUserIdentityRepository();

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      await useCase.execute(cmd);

      const found = await userRepo.findByEmail(
        Email.fromString('social@example.com'),
      );
      expect(found).not.toBeNull();
      expect(found?.passwordHash).toBeNull();
      expect(found?.name).toBe('Social User');
      expect(found?.isAdmin).toBe(false);
    });

    it('links the identity so future logins use Path 1', async () => {
      const userRepo = new InMemoryUserRepository();
      const identityRepo = new InMemoryUserIdentityRepository();

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      await useCase.execute(cmd);

      const linkedId = await identityRepo.findByProvider(
        AuthProvider.Google,
        'google-uid-123',
      );
      expect(linkedId).not.toBeNull();

      const user = await userRepo.findByEmail(
        Email.fromString('social@example.com'),
      );
      expect(linkedId?.value).toBe(user?.id.value);
    });

    it('Facebook provider also works', async () => {
      const userRepo = new InMemoryUserRepository();
      const identityRepo = new InMemoryUserIdentityRepository();

      const useCase = new AuthenticateWithProvider(
        userRepo,
        identityRepo,
        tokenService,
      );
      const result = await useCase.execute({
        provider: AuthProvider.Facebook,
        providerUserId: 'fb-uid-456',
        email: 'fb@example.com',
        name: 'FB User',
      });

      expect(result.accessToken).toContain('fb@example.com');
    });
  });
});
