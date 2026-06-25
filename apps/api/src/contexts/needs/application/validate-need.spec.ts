import { ValidateNeed } from './validate-need';
import { CreateNeed } from './create-need';
import { InMemoryNeedRepository } from '../infrastructure/in-memory-need.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { NeedCategory, Priority, NeedStatus } from '../domain/need-enums';
import { NeedNotFoundError } from './need-not-found.error';

const EM = '11111111-1111-4111-8111-111111111111';

describe('ValidateNeed', () => {
  let repo: InMemoryNeedRepository;
  let bus: FakeEventBus;
  let validateNeed: ValidateNeed;
  let createNeed: CreateNeed;

  beforeEach(() => {
    repo = new InMemoryNeedRepository();
    bus = new FakeEventBus();
    validateNeed = new ValidateNeed(repo, bus);
    createNeed = new CreateNeed(repo, bus);
  });

  it('transitions need to Validated status', async () => {
    const { id } = await createNeed.execute({
      emergencyId: EM,
      title: 'Medical supplies',
      category: NeedCategory.Medical,
      priority: Priority.Urgent,
      requestedQuantity: 10,
      unit: 'kits',
    });
    bus.published = []; // reset

    await validateNeed.execute({ needId: id });

    const need = await repo.findById({ value: id } as never);
    expect(need!.status).toBe(NeedStatus.Validated);
    expect(bus.published.map((e) => e.eventName)).toEqual(['need.validated']);
  });

  it('throws NeedNotFoundError for unknown id', async () => {
    await expect(
      validateNeed.execute({ needId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
    ).rejects.toThrow(NeedNotFoundError);
  });
});
