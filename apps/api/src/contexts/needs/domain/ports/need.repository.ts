import { Need } from '../need';
import { NeedId } from '../need-id';
import { EmergencyId } from '../emergency-id';
import { NeedStatus } from '../need-enums';

export const NEED_REPOSITORY = Symbol('NeedRepository');

export interface NeedRepository {
  save(need: Need): Promise<void>;
  findById(id: NeedId): Promise<Need | null>;
  findValidatedByEmergency(emergencyId: EmergencyId): Promise<Need[]>;
  findPendingByEmergency(emergencyId: EmergencyId): Promise<Need[]>;
  /** Returns a count map for all NeedStatus values for the given emergency. */
  countByEmergencyGroupedByStatus(emergencyId: EmergencyId): Promise<Record<NeedStatus, number>>;
}
