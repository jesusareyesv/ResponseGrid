import { GetNeedsQueue } from './get-needs-queue';
import { CreateNeed } from './create-need';
import { ValidateNeed } from './validate-need';
import { InMemoryNeedRepository } from '../infrastructure/in-memory-need.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { NeedCategory, Priority, NeedStatus } from '../domain/need-enums';

const EM = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const baseCmd = {
  emergencyId: EM,
  requesterUserId: USER_ID,
  requesterOrganizationId: null,
  description: null,
  location: { address: 'Caracas', latitude: 10.4806, longitude: -66.9036 },
  items: [{ name: 'Food', quantity: 10, unit: null, category: NeedCategory.Food }],
};

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
    const { id: id1 } = await createNeed.execute({ ...baseCmd, title: 'Pending need', priority: Priority.High });
    const { id: id2 } = await createNeed.execute({ ...baseCmd, title: 'Will be validated', priority: Priority.Urgent });

    await validateNeed.execute({ needId: id2 });

    const result = await getNeedsQueue.execute({ emergencyId: EM });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id1);
    expect(result[0].status).toBe(NeedStatus.Pending);
  });

  it('includes items and location in pending view', async () => {
    const { id } = await createNeed.execute({
      ...baseCmd,
      title: 'Queue check',
      priority: Priority.Medium,
      items: [
        { name: 'Blankets', quantity: 30, unit: null, category: NeedCategory.Shelter },
      ],
    });

    const result = await getNeedsQueue.execute({ emergencyId: EM });
    expect(result[0].id).toBe(id);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].name).toBe('Blankets');
  });

  it('returns empty when all needs validated', async () => {
    const { id } = await createNeed.execute({ ...baseCmd, title: 'Need', priority: Priority.Medium });
    await validateNeed.execute({ needId: id });

    const result = await getNeedsQueue.execute({ emergencyId: EM });
    expect(result).toHaveLength(0);
  });
});
