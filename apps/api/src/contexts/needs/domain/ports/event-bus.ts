import { DomainEvent } from '../events/domain-event';

export const EVENT_BUS = Symbol('NeedsEventBus');

export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
}
