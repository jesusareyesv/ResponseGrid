import { DomainEvent } from '../events/domain-event';

export const EVENT_BUS = Symbol('EventBus');

export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
}
