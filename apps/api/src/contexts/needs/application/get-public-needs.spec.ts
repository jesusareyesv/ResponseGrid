import { GetPublicNeeds } from './get-public-needs';
import { CreateNeed } from './create-need';
import { ValidateNeed } from './validate-need';
import { InMemoryNeedRepository } from '../infrastructure/in-memory-need.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { NeedCategory, Priority, NeedStatus } from '../domain/need-enums';

const EM = '11111111-1111-4111-8111-111111111111';

describe('GetPublicNeeds', () => {
  let repo: InMemoryNeedRepository;
  let bus: FakeEventBus;
  let getPublicNeeds: GetPublicNeeds;
  let createNeed: CreateNeed;
  let validateNeed: ValidateNeed;

  beforeEach(() => {
    repo = new InMemoryNeedRepository();
    bus = new FakeEventBus();
    getPublicNeeds = new GetPublicNeeds(repo);
    createNeed = new CreateNeed(repo, bus);
    validateNeed = new ValidateNeed(repo, bus);
  });

  it('returns only validated needs', async () => {
    const { id: id1 } = await createNeed.execute({
      emergencyId: EM,
      title: 'Validated need',
      category: NeedCategory.Food,
      priority: Priority.High,
      requestedQuantity: null,
      unit: null,
    });
    await createNeed.execute({
      emergencyId: EM,
      title: 'Still pending',
      category: NeedCategory.Water,
      priority: Priority.Medium,
      requestedQuantity: null,
      unit: null,
    });

    await validateNeed.execute({ needId: id1 });

    const result = await getPublicNeeds.execute({ emergencyId: EM });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id1);
    expect(result[0].status).toBe(NeedStatus.Validated);
  });

  it('returns empty array when no validated needs', async () => {
    await createNeed.execute({
      emergencyId: EM,
      title: 'Pending need',
      category: NeedCategory.Shelter,
      priority: Priority.Low,
      requestedQuantity: null,
      unit: null,
    });

    const result = await getPublicNeeds.execute({ emergencyId: EM });
    expect(result).toHaveLength(0);
  });
});
