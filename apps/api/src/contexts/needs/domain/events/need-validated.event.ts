import { DomainEvent } from './domain-event';

export class NeedValidated implements DomainEvent {
  readonly eventName = 'need.validated';
  readonly occurredOn = new Date();

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      emergencyId: string;
    },
  ) {}
}
