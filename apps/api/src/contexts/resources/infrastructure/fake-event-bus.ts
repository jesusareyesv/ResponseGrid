import { EventBus } from '../domain/ports/event-bus';
import { DomainEvent } from '../domain/events/domain-event';

export class FakeEventBus implements EventBus {
  public published: DomainEvent[] = [];
  publish(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
    return Promise.resolve();
  }
}
