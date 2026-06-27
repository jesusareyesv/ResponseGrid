export interface AuditEntrySnapshot {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  emergencyId: string | null;
  method: string;
  path: string;
  statusCode: number;
  createdAt: Date;
}

export interface CreateAuditEntryProps {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  emergencyId: string | null;
  method: string;
  path: string;
  statusCode: number;
}

export class AuditEntry {
  private constructor(
    public readonly id: string,
    public readonly actorUserId: string | null,
    public readonly action: string,
    public readonly entityType: string | null,
    public readonly entityId: string | null,
    public readonly emergencyId: string | null,
    public readonly method: string,
    public readonly path: string,
    public readonly statusCode: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateAuditEntryProps): AuditEntry {
    return new AuditEntry(
      props.id,
      props.actorUserId,
      props.action,
      props.entityType,
      props.entityId,
      props.emergencyId,
      props.method,
      props.path,
      props.statusCode,
      new Date(),
    );
  }

  static fromSnapshot(s: AuditEntrySnapshot): AuditEntry {
    return new AuditEntry(
      s.id,
      s.actorUserId,
      s.action,
      s.entityType,
      s.entityId,
      s.emergencyId,
      s.method,
      s.path,
      s.statusCode,
      s.createdAt,
    );
  }

  toSnapshot(): AuditEntrySnapshot {
    return {
      id: this.id,
      actorUserId: this.actorUserId,
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId,
      emergencyId: this.emergencyId,
      method: this.method,
      path: this.path,
      statusCode: this.statusCode,
      createdAt: this.createdAt,
    };
  }
}
