import { UserRepository } from '../domain/ports/user.repository';
import { User } from '../domain/user';
import { UserId } from '../domain/user-id';
import { Email } from '../domain/email';

export class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, ReturnType<User['toSnapshot']>>();

  save(user: User): Promise<void> {
    this.store.set(user.id.value, user.toSnapshot());
    return Promise.resolve();
  }

  findByEmail(email: Email): Promise<User | null> {
    const snap = [...this.store.values()].find((s) => s.email === email.value);
    return Promise.resolve(snap ? User.fromSnapshot(snap) : null);
  }

  findById(id: UserId): Promise<User | null> {
    const snap = this.store.get(id.value);
    return Promise.resolve(snap ? User.fromSnapshot(snap) : null);
  }

  /** Test helper — returns the total number of stored users. */
  countAll(): Promise<number> {
    return Promise.resolve(this.store.size);
  }
}
