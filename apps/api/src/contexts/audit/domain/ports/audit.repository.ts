import { AuditEntry } from '../audit-entry';

export const AUDIT_REPOSITORY = Symbol('AuditRepository');

export interface AuditQueryFilters {
  emergencyId?: string;
  actorUserId?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}

export interface AuditRepository {
  save(entry: AuditEntry): Promise<void>;
  findAll(filters: AuditQueryFilters): Promise<AuditEntry[]>;
}
