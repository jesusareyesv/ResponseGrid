import { Resource } from './resource';
import { ResourceId } from './resource-id';
import { EmergencyId } from './emergency-id';
import { ResourceType, ResourceSide, VerificationLevel, PublicStatus } from './resource-enums';
import { ResourceNotVerifiedError, InvalidVerificationLevelError } from './resource-errors';

const make = () =>
  Resource.register({
    id: ResourceId.create(),
    emergencyId: EmergencyId.fromString('11111111-1111-4111-8111-111111111111'),
    type: ResourceType.Warehouse,
    side: ResourceSide.Origin,
    name: 'Almacén Centro',
  });

describe('Resource', () => {
  it('registers as unverified and hidden, emitting ResourceRegistered', () => {
    const r = make();
    expect(r.verificationLevel).toBe(VerificationLevel.Unverified);
    expect(r.publicStatus).toBe(PublicStatus.Hidden);
    const events = r.pullDomainEvents();
    expect(events.map((e) => e.eventName)).toEqual(['resource.registered']);
    expect(r.pullDomainEvents()).toEqual([]); // buffer drained
  });

  it('verifies and emits ResourceVerified but stays hidden (registrar ≠ publicar)', () => {
    const r = make();
    r.pullDomainEvents();
    r.verify(VerificationLevel.Verified, 'coord-1');
    expect(r.verificationLevel).toBe(VerificationLevel.Verified);
    expect(r.publicStatus).toBe(PublicStatus.Hidden);
    expect(r.pullDomainEvents().map((e) => e.eventName)).toEqual(['resource.verified']);
  });

  it('rejects verifying with the unverified level', () => {
    const r = make();
    expect(() => r.verify(VerificationLevel.Unverified, 'coord-1')).toThrow(InvalidVerificationLevelError);
  });

  it('publishes only after verification', () => {
    const r = make();
    expect(() => r.publish()).toThrow(ResourceNotVerifiedError);
    r.verify(VerificationLevel.Official, 'coord-1');
    r.pullDomainEvents();
    r.publish();
    expect(r.publicStatus).toBe(PublicStatus.Active);
    expect(r.pullDomainEvents().map((e) => e.eventName)).toEqual(['resource.published']);
  });
});
