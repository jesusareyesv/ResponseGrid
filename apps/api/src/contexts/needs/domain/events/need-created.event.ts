import { DomainEvent } from './domain-event';

export class NeedCreated implements DomainEvent {
  readonly eventName = 'need.created';
  readonly occurredOn = new Date();

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      emergencyId: string;
      category: string;
      priority: string;
    },
  ) {}
}
