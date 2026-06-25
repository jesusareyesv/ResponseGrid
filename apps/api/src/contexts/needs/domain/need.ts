import { NeedId } from './need-id';
import { EmergencyId } from './emergency-id';
import { NeedCategory, Priority, NeedStatus } from './need-enums';
import { NeedNotPendingError } from './need-errors';
import { DomainEvent } from './events/domain-event';
import { NeedCreated } from './events/need-created.event';
import { NeedValidated } from './events/need-validated.event';
import { NeedRejected } from './events/need-rejected.event';

export interface CreateNeedProps {
  id: NeedId;
  emergencyId: EmergencyId;
  title: string;
  category: NeedCategory;
  priority: Priority;
  requestedQuantity: number | null;
  unit: string | null;
}

export interface NeedSnapshot {
  id: string;
  emergencyId: string;
  title: string;
  category: NeedCategory;
  priority: Priority;
  requestedQuantity: number | null;
  unit: string | null;
  status: NeedStatus;
  createdAt: Date;
}

export class Need {
  private events: DomainEvent[] = [];

  private constructor(
    public readonly id: NeedId,
    public readonly emergencyId: EmergencyId,
    public readonly title: string,
    public readonly category: NeedCategory,
    public readonly priority: Priority,
    public readonly requestedQuantity: number | null,
    public readonly unit: string | null,
    private _status: NeedStatus,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateNeedProps): Need {
    const need = new Need(
      props.id,
      props.emergencyId,
      props.title,
      props.category,
      props.priority,
      props.requestedQuantity,
      props.unit,
      NeedStatus.Pending,
      new Date(),
    );
    need.events.push(
      new NeedCreated(need.id.value, {
        emergencyId: need.emergencyId.value,
        category: need.category,
        priority: need.priority,
      }),
    );
    return need;
  }

  static fromSnapshot(s: NeedSnapshot): Need {
    return new Need(
      NeedId.fromString(s.id),
      EmergencyId.fromString(s.emergencyId),
      s.title,
      s.category,
      s.priority,
      s.requestedQuantity,
      s.unit,
      s.status,
      s.createdAt,
    );
  }

  get status(): NeedStatus {
    return this._status;
  }

  validate(): void {
    if (this._status !== NeedStatus.Pending) {
      throw new NeedNotPendingError();
    }
    this._status = NeedStatus.Validated;
    this.events.push(
      new NeedValidated(this.id.value, { emergencyId: this.emergencyId.value }),
    );
  }

  reject(): void {
    if (this._status !== NeedStatus.Pending) {
      throw new NeedNotPendingError();
    }
    this._status = NeedStatus.Rejected;
    this.events.push(
      new NeedRejected(this.id.value, { emergencyId: this.emergencyId.value }),
    );
  }

  toSnapshot(): NeedSnapshot {
    return {
      id: this.id.value,
      emergencyId: this.emergencyId.value,
      title: this.title,
      category: this.category,
      priority: this.priority,
      requestedQuantity: this.requestedQuantity,
      unit: this.unit,
      status: this._status,
      createdAt: this.createdAt,
    };
  }

  pullDomainEvents(): DomainEvent[] {
    const drained = this.events;
    this.events = [];
    return drained;
  }
}
