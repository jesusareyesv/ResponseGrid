import { GetPublicNeeds } from './get-public-needs';
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
  items: [{ name: 'Water', quantity: 10, unit: null, category: NeedCategory.Water }],
};

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
    const { id: id1 } = await createNeed.execute({ ...baseCmd, title: 'Validated need', priority: Priority.High });
    await createNeed.execute({ ...baseCmd, title: 'Still pending', priority: Priority.Medium });

    await validateNeed.execute({ needId: id1 });

    const result = await getPublicNeeds.execute({ emergencyId: EM });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(id1);
    expect(result[0].status).toBe(NeedStatus.Validated);
  });

  it('includes items, location and description in view', async () => {
    const { id } = await createNeed.execute({
      ...baseCmd,
      title: 'Rich need',
      priority: Priority.Urgent,
      description: 'Urgent water need',
      location: { address: 'Plaza Bolívar, Caracas', latitude: 10.48, longitude: -66.9 },
      items: [
        { name: 'Water', quantity: 100, unit: 'liters', category: NeedCategory.Water },
        { name: 'Food', quantity: 50, unit: 'boxes', category: NeedCategory.Food },
      ],
    });
    await validateNeed.execute({ needId: id });

    const result = await getPublicNeeds.execute({ emergencyId: EM });
    expect(result[0].description).toBe('Urgent water need');
    expect(result[0].location.address).toBe('Plaza Bolívar, Caracas');
    expect(result[0].items).toHaveLength(2);
  });

  it('returns empty array when no validated needs', async () => {
    await createNeed.execute({ ...baseCmd, title: 'Pending need', priority: Priority.Low });
    const result = await getPublicNeeds.execute({ emergencyId: EM });
    expect(result).toHaveLength(0);
  });
});
