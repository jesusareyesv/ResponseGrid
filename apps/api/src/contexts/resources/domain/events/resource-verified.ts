import { DomainEvent } from './domain-event';

export class ResourceVerified implements DomainEvent {
  readonly eventName = 'resource.verified';
  readonly occurredOn = new Date();
  constructor(
    readonly aggregateId: string,
    readonly payload: { emergencyId: string; level: string; coordinatorId: string },
  ) {}
}
