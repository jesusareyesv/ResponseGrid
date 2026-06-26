import { MembershipRepository } from '../domain/ports/membership.repository';
import { Membership } from '../domain/membership';
import { UserId } from '../domain/user-id';
import { Role } from '../domain/role';

export class InMemoryMembershipRepository implements MembershipRepository {
  private store = new Map<string, ReturnType<Membership['toSnapshot']>>();

  save(membership: Membership): Promise<void> {
    const key = `${membership.userId.value}:${membership.emergencyId}:${membership.role}`;
    this.store.set(key, membership.toSnapshot());
    return Promise.resolve();
  }

  findByUser(userId: UserId): Promise<Membership[]> {
    const result = [...this.store.values()]
      .filter((s) => s.userId === userId.value)
      .map((s) => Membership.fromSnapshot(s));
    return Promise.resolve(result);
  }

  hasRole(userId: UserId, emergencyId: string, role: Role): Promise<boolean> {
    const key = `${userId.value}:${emergencyId}:${role}`;
    return Promise.resolve(this.store.has(key));
  }
}
