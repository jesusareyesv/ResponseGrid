import { AuditEntry } from '../domain/audit-entry';
import {
  AuditQueryFilters,
  AuditRepository,
} from '../domain/ports/audit.repository';

export class InMemoryAuditRepository implements AuditRepository {
  private readonly entries: AuditEntry[] = [];

  save(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  findAll(filters: AuditQueryFilters): Promise<AuditEntry[]> {
    let result = [...this.entries];

    if (filters.emergencyId) {
      result = result.filter((e) => e.emergencyId === filters.emergencyId);
    }
    if (filters.actorUserId) {
      result = result.filter((e) => e.actorUserId === filters.actorUserId);
    }
    if (filters.entityType) {
      result = result.filter((e) => e.entityType === filters.entityType);
    }

    // desc by createdAt
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 100;
    return Promise.resolve(result.slice(offset, offset + limit));
  }

  /** Test helper: clear all entries */
  clear(): void {
    this.entries.length = 0;
  }

  /** Test helper: raw access */
  all(): AuditEntry[] {
    return [...this.entries];
  }
}
