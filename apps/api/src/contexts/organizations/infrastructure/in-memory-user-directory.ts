import { UserDirectory, UserView } from '../domain/ports/user-directory';

export class InMemoryUserDirectory implements UserDirectory {
  private store = new Map<string, UserView>();

  seed(user: UserView): void {
    this.store.set(user.id, user);
  }

  findByEmail(email: string): Promise<UserView | null> {
    for (const user of this.store.values()) {
      if (user.email === email) return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<UserView | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }
}
