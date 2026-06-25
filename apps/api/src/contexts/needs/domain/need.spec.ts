import { Need } from './need';
import { NeedId } from './need-id';
import { EmergencyId } from './emergency-id';
import { NeedCategory, Priority, NeedStatus } from './need-enums';
import { NeedNotPendingError } from './need-errors';

const EM = '11111111-1111-4111-8111-111111111111';

function makeNeed(): Need {
  return Need.create({
    id: NeedId.create(),
    emergencyId: EmergencyId.fromString(EM),
    title: 'Water for refugees',
    category: NeedCategory.Water,
    priority: Priority.Urgent,
    requestedQuantity: 100,
    unit: 'liters',
  });
}

describe('Need aggregate', () => {
  it('creates with Pending status and emits need.created event', () => {
    const need = makeNeed();
    expect(need.status).toBe(NeedStatus.Pending);
    const events = need.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('need.created');
  });

  it('validate() transitions to Validated and emits need.validated event', () => {
    const need = makeNeed();
    need.pullDomainEvents(); // drain creation event
    need.validate();
    expect(need.status).toBe(NeedStatus.Validated);
    const events = need.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('need.validated');
  });

  it('reject() transitions to Rejected and emits need.rejected event', () => {
    const need = makeNeed();
    need.pullDomainEvents();
    need.reject();
    expect(need.status).toBe(NeedStatus.Rejected);
    const events = need.pullDomainEvents();
    expect(events[0].eventName).toBe('need.rejected');
  });

  it('validate() throws NeedNotPendingError when already validated', () => {
    const need = makeNeed();
    need.validate();
    expect(() => need.validate()).toThrow(NeedNotPendingError);
  });

  it('reject() throws NeedNotPendingError when already rejected', () => {
    const need = makeNeed();
    need.reject();
    expect(() => need.reject()).toThrow(NeedNotPendingError);
  });

  it('validate() throws NeedNotPendingError when rejected', () => {
    const need = makeNeed();
    need.reject();
    expect(() => need.validate()).toThrow(NeedNotPendingError);
  });

  it('pullDomainEvents() drains events (idempotent second call)', () => {
    const need = makeNeed();
    need.pullDomainEvents();
    expect(need.pullDomainEvents()).toHaveLength(0);
  });

  it('fromSnapshot() rehydrates correctly', () => {
    const need = makeNeed();
    need.validate();
    const snap = need.toSnapshot();
    const restored = Need.fromSnapshot(snap);
    expect(restored.status).toBe(NeedStatus.Validated);
    expect(restored.title).toBe('Water for refugees');
    expect(restored.requestedQuantity).toBe(100);
    expect(restored.unit).toBe('liters');
    expect(restored.pullDomainEvents()).toHaveLength(0);
  });

  it('handles null requestedQuantity and unit', () => {
    const need = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(EM),
      title: 'General help',
      category: NeedCategory.Other,
      priority: Priority.Low,
      requestedQuantity: null,
      unit: null,
    });
    expect(need.requestedQuantity).toBeNull();
    expect(need.unit).toBeNull();
  });
});
