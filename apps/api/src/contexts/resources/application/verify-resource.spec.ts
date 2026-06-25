import { VerifyResource } from './verify-resource';
import { RegisterResource } from './register-resource';
import { ResourceNotFoundError } from './resource-not-found.error';
import { InMemoryResourceRepository } from '../infrastructure/in-memory-resource.repository';
import { FakeEventBus } from '../infrastructure/fake-event-bus';
import { ResourceId } from '../domain/resource-id';
import { ResourceType, ResourceSide, VerificationLevel } from '../domain/resource-enums';

const EM = '11111111-1111-4111-8111-111111111111';

describe('VerifyResource', () => {
  it('sets the level and publishes ResourceVerified', async () => {
    const repo = new InMemoryResourceRepository();
    const bus = new FakeEventBus();
    const { id } = await new RegisterResource(repo, bus).execute({
      emergencyId: EM, type: ResourceType.Warehouse, side: ResourceSide.Origin, name: 'Almacén',
    });
    bus.published = [];

    await new VerifyResource(repo, bus).execute({ resourceId: id, level: VerificationLevel.Official, coordinatorId: 'c1' });

    const found = await repo.findById(ResourceId.fromString(id));
    expect(found?.verificationLevel).toBe(VerificationLevel.Official);
    expect(bus.published.map((e) => e.eventName)).toEqual(['resource.verified']);
  });

  it('throws ResourceNotFoundError for an unknown id', async () => {
    const repo = new InMemoryResourceRepository();
    await expect(
      new VerifyResource(repo, new FakeEventBus()).execute({
        resourceId: '99999999-9999-4999-8999-999999999999', level: VerificationLevel.Verified, coordinatorId: 'c1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
