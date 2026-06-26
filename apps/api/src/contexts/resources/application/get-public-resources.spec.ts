import { GetPublicResources } from './get-public-resources';
import { RegisterResource } from './register-resource';
import { VerifyResource } from './verify-resource';
import { PublishResource } from './publish-resource';
import { InMemoryResourceRepository } from '../infrastructure/in-memory-resource.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import {
  ResourceType,
  ResourceStage,
  PublicStatus,
} from '../domain/resource-enums';

const EM = '11111111-1111-4111-8111-111111111111';
const baseLocation = {
  address: 'Plaza España, Sevilla',
  latitude: 37.3774,
  longitude: -5.9863,
};

describe('GetPublicResources', () => {
  it('returns only published (active) resources of the emergency as views', async () => {
    const repo = new InMemoryResourceRepository();
    const bus = new FakeEventBus();
    const register = new RegisterResource(repo, bus);
    const verify = new VerifyResource(repo, bus);
    const publish = new PublishResource(repo, bus);

    const { id } = await register.execute({
      emergencyId: EM,
      type: ResourceType.Warehouse,
      stage: ResourceStage.Origin,
      name: 'Almacén Público',
      location: baseLocation,
      ownerUserId: 'user-public-test',
    });
    await verify.execute({
      resourceId: id,
      level: 'verified' as const,
      coordinatorId: 'c1',
    });
    await publish.execute({ resourceId: id });

    const views = await new GetPublicResources(repo).execute({
      emergencyId: EM,
    });

    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({
      name: 'Almacén Público',
      publicStatus: PublicStatus.Active,
      stage: ResourceStage.Origin,
    });
    expect(views[0].location).toEqual(baseLocation);
  });

  it('does not return unverified or unpublished resources', async () => {
    const repo = new InMemoryResourceRepository();
    const bus = new FakeEventBus();
    const register = new RegisterResource(repo, bus);

    await register.execute({
      emergencyId: EM,
      type: ResourceType.CollectionPoint,
      stage: ResourceStage.Destination,
      name: 'Solo Registrado',
      location: baseLocation,
      ownerUserId: 'user-unverified-test',
    });

    const views = await new GetPublicResources(repo).execute({
      emergencyId: EM,
    });

    expect(views).toHaveLength(0);
  });
});
