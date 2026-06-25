import { GetCoordinationQueue } from './get-coordination-queue';
import { RegisterResource } from './register-resource';
import { InMemoryResourceRepository } from '../infrastructure/in-memory-resource.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { ResourceType, ResourceSide } from '../domain/resource-enums';

const EM = '11111111-1111-4111-8111-111111111111';

describe('GetCoordinationQueue', () => {
  it('returns pending resources of the emergency as views', async () => {
    const repo = new InMemoryResourceRepository();
    const register = new RegisterResource(repo, new FakeEventBus());
    await register.execute({ emergencyId: EM, type: ResourceType.CollectionPoint, side: ResourceSide.Origin, name: 'Punto 1' });

    const views = await new GetCoordinationQueue(repo).execute({ emergencyId: EM });

    expect(views).toEqual([
      expect.objectContaining({ name: 'Punto 1', verificationLevel: 'unverified', publicStatus: 'hidden' }),
    ]);
  });
});
