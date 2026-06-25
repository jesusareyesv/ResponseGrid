import { NeedRepository } from '../domain/ports/need.repository';
import { Need } from '../domain/need';
import { NeedId } from '../domain/need-id';
import { EmergencyId } from '../domain/emergency-id';
import { NeedStatus } from '../domain/need-enums';

export class InMemoryNeedRepository implements NeedRepository {
  private store = new Map<string, ReturnType<Need['toSnapshot']>>();

  async save(need: Need): Promise<void> {
    this.store.set(need.id.value, need.toSnapshot());
  }

  async findById(id: NeedId): Promise<Need | null> {
    const snap = this.store.get(id.value);
    return snap ? Need.fromSnapshot(snap) : null;
  }

  async findValidatedByEmergency(emergencyId: EmergencyId): Promise<Need[]> {
    return [...this.store.values()]
      .filter((s) => s.emergencyId === emergencyId.value && s.status === NeedStatus.Validated)
      .map((s) => Need.fromSnapshot(s));
  }

  async findPendingByEmergency(emergencyId: EmergencyId): Promise<Need[]> {
    return [...this.store.values()]
      .filter((s) => s.emergencyId === emergencyId.value && s.status === NeedStatus.Pending)
      .map((s) => Need.fromSnapshot(s));
  }
}
