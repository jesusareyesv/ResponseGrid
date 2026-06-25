import { GetNeedsQueue } from './get-needs-queue';
import { CreateNeed } from './create-need';
import { ValidateNeed } from './validate-need';
import { InMemoryNeedRepository } from '../infrastructure/in-memory-need.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { NeedCategory, Priority, NeedStatus } from '../domain/need-enums';

const EM = '11111111-1111-4111-8111-111111111111';

describe('GetNeedsQueue', () => {
  let repo: InMemoryNeedRepository;
  let bus: FakeEventBus;
  let getNeedsQueue: GetNeedsQueue;
  let createNeed: CreateNeed;
  let validateNeed: ValidateNeed;

  beforeEach(() => {
    repo = new InMemoryNeedRepository();
    bus = new FakeEventBus();
    getNeedsQueue = new GetNeedsQueue(repo);
    createNeed = new CreateNeed(repo, bus);
    validateNeed = new ValidateNeed(repo, bus);
  });

  it('returns only pending needs', async () => {
    const { id: id1 } = await createNeed.execute({
      emergencyId: EM,
      title: 'Pending need',
      category: NeedCategory.Food,
      priority: Priority.High,
      requestedQuantity: null,
      unit: null,
    });
    const { id: id2 } = await createNeed.execute({
      emergencyId: EM,
      title: 'Will be validated',
      category: NeedCategory.Water,
      priority: Priority.Urgent,
      requestedQuantity: null,
      unit: null,
    });

    await validateNeed.execute({ needId: id2 });

    const result = await getNeedsQueue.execute({ emergencyId: EM });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id1);
    expect(result[0].status).toBe(NeedStatus.Pending);
  });

  it('returns empty when all needs validated', async () => {
    const { id } = await createNeed.execute({
      emergencyId: EM,
      title: 'Need',
      category: NeedCategory.Medical,
      priority: Priority.Medium,
      requestedQuantity: null,
      unit: null,
    });
    await validateNeed.execute({ needId: id });

    const result = await getNeedsQueue.execute({ emergencyId: EM });
    expect(result).toHaveLength(0);
  });
});
