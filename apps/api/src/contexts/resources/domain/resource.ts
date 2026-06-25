import { ResourceId } from './resource-id';
import { EmergencyId } from './emergency-id';
import { ResourceType, ResourceSide, VerificationLevel, PublicStatus } from './resource-enums';
import { InvalidVerificationLevelError, ResourceNotVerifiedError } from './resource-errors';
import { DomainEvent } from './events/domain-event';
import { ResourceRegistered } from './events/resource-registered';
import { ResourceVerified } from './events/resource-verified';
import { ResourcePublished } from './events/resource-published';

export interface RegisterResourceProps {
  id: ResourceId;
  emergencyId: EmergencyId;
  type: ResourceType;
  side: ResourceSide;
  name: string;
}

// Snapshot used by repositories to rehydrate without going through register().
export interface ResourceSnapshot {
  id: string;
  emergencyId: string;
  type: ResourceType;
  side: ResourceSide;
  name: string;
  verificationLevel: VerificationLevel;
  publicStatus: PublicStatus;
  createdAt: Date;
}

export class Resource {
  private events: DomainEvent[] = [];

  private constructor(
    public readonly id: ResourceId,
    public readonly emergencyId: EmergencyId,
    public readonly type: ResourceType,
    public readonly side: ResourceSide,
    public readonly name: string,
    private _verificationLevel: VerificationLevel,
    private _publicStatus: PublicStatus,
    public readonly createdAt: Date,
  ) {}

  static register(props: RegisterResourceProps): Resource {
    const r = new Resource(
      props.id,
      props.emergencyId,
      props.type,
      props.side,
      props.name,
      VerificationLevel.Unverified,
      PublicStatus.Hidden,
      new Date(),
    );
    r.events.push(
      new ResourceRegistered(r.id.value, {
        emergencyId: r.emergencyId.value,
        type: r.type,
        side: r.side,
        name: r.name,
      }),
    );
    return r;
  }

  static fromSnapshot(s: ResourceSnapshot): Resource {
    return new Resource(
      ResourceId.fromString(s.id),
      EmergencyId.fromString(s.emergencyId),
      s.type,
      s.side,
      s.name,
      s.verificationLevel,
      s.publicStatus,
      s.createdAt,
    );
  }

  get verificationLevel(): VerificationLevel {
    return this._verificationLevel;
  }
  get publicStatus(): PublicStatus {
    return this._publicStatus;
  }

  verify(level: VerificationLevel, coordinatorId: string): void {
    if (level === VerificationLevel.Unverified) {
      throw new InvalidVerificationLevelError(level);
    }
    this._verificationLevel = level;
    this.events.push(
      new ResourceVerified(this.id.value, {
        emergencyId: this.emergencyId.value,
        level,
        coordinatorId,
      }),
    );
  }

  publish(): void {
    if (this._verificationLevel === VerificationLevel.Unverified) {
      throw new ResourceNotVerifiedError();
    }
    this._publicStatus = PublicStatus.Active;
    this.events.push(new ResourcePublished(this.id.value, { emergencyId: this.emergencyId.value }));
  }

  toSnapshot(): ResourceSnapshot {
    return {
      id: this.id.value,
      emergencyId: this.emergencyId.value,
      type: this.type,
      side: this.side,
      name: this.name,
      verificationLevel: this._verificationLevel,
      publicStatus: this._publicStatus,
      createdAt: this.createdAt,
    };
  }

  pullDomainEvents(): DomainEvent[] {
    const drained = this.events;
    this.events = [];
    return drained;
  }
}
