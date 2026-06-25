import { DomainEvent } from './domain-event';

export class ResourcePublished implements DomainEvent {
  readonly eventName = 'resource.published';
  readonly occurredOn = new Date();
  constructor(
    readonly aggregateId: string,
    readonly payload: { emergencyId: string },
  ) {}
}
