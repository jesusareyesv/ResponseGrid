import { CreateNeed } from './create-need';
import { InMemoryNeedRepository } from '../infrastructure/in-memory-need.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { NeedCategory, Priority, NeedStatus } from '../domain/need-enums';

const EM = '11111111-1111-4111-8111-111111111111';

describe('CreateNeed', () => {
  let repo: InMemoryNeedRepository;
  let bus: FakeEventBus;
  let useCase: CreateNeed;

  beforeEach(() => {
    repo = new InMemoryNeedRepository();
    bus = new FakeEventBus();
    useCase = new CreateNeed(repo, bus);
  });

  it('creates a need with Pending status and returns its id', async () => {
    const result = await useCase.execute({
      emergencyId: EM,
      title: 'Food supplies',
      category: NeedCategory.Food,
      priority: Priority.High,
      requestedQuantity: 50,
      unit: 'boxes',
    });

    expect(result.id).toBeDefined();
    const saved = await repo.findById({ value: result.id } as never);
    expect(saved).not.toBeNull();
    expect(saved!.status).toBe(NeedStatus.Pending);
  });

  it('publishes need.created event', async () => {
    await useCase.execute({
      emergencyId: EM,
      title: 'Water',
      category: NeedCategory.Water,
      priority: Priority.Urgent,
      requestedQuantity: null,
      unit: null,
    });

    expect(bus.published.map((e) => e.eventName)).toEqual(['need.created']);
  });

  it('handles null optional fields', async () => {
    const result = await useCase.execute({
      emergencyId: EM,
      title: 'General need',
      category: NeedCategory.Other,
      priority: Priority.Low,
      requestedQuantity: null,
      unit: null,
    });

    expect(result.id).toBeDefined();
  });
});
