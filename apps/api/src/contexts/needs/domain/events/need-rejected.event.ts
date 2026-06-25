import { DomainEvent } from './domain-event';

export class NeedRejected implements DomainEvent {
  readonly eventName = 'need.rejected';
  readonly occurredOn = new Date();

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      emergencyId: string;
    },
  ) {}
}
