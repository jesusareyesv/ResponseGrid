import { PublishResource } from './publish-resource';
import { VerifyResource } from './verify-resource';
import { RegisterResource } from './register-resource';
import { InMemoryResourceRepository } from '../infrastructure/in-memory-resource.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { ResourceId } from '../domain/resource-id';
import { ResourceType, ResourceSide, VerificationLevel, PublicStatus } from '../domain/resource-enums';
import { ResourceNotVerifiedError } from '../domain/resource-errors';

const EM = '11111111-1111-4111-8111-111111111111';

describe('PublishResource', () => {
  it('publishes a verified resource and emits ResourcePublished', async () => {
    const repo = new InMemoryResourceRepository();
    const bus = new FakeEventBus();
    const { id } = await new RegisterResource(repo, bus).execute({
      emergencyId: EM, type: ResourceType.CollectionPoint, side: ResourceSide.Origin, name: 'Punto',
    });
    await new VerifyResource(repo, bus).execute({ resourceId: id, level: VerificationLevel.Verified, coordinatorId: 'c1' });
    bus.published = [];

    await new PublishResource(repo, bus).execute({ resourceId: id });

    const found = await repo.findById(ResourceId.fromString(id));
    expect(found?.publicStatus).toBe(PublicStatus.Active);
    expect(bus.published.map((e) => e.eventName)).toEqual(['resource.published']);
  });

  it('refuses to publish an unverified resource', async () => {
    const repo = new InMemoryResourceRepository();
    const bus = new FakeEventBus();
    const { id } = await new RegisterResource(repo, bus).execute({
      emergencyId: EM, type: ResourceType.CollectionPoint, side: ResourceSide.Origin, name: 'Punto',
    });
    await expect(new PublishResource(repo, bus).execute({ resourceId: id })).rejects.toBeInstanceOf(ResourceNotVerifiedError);
  });
});
