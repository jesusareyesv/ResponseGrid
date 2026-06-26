import { Accreditation } from '../accreditation';

export const ACCREDITATION_REPOSITORY = Symbol('AccreditationRepository');

export interface ListAccreditationsFilter {
  organizationId?: string;
  emergencyId?: string;
}

export interface AccreditationRepository {
  save(accreditation: Accreditation): Promise<void>;
  findById(id: string): Promise<Accreditation | null>;
  delete(id: string): Promise<void>;
  list(filter: ListAccreditationsFilter): Promise<Accreditation[]>;
  /** Returns true if the org has an active accreditation covering the given emergency (global OR matching emergencyId). */
  isAccredited(organizationId: string, emergencyId: string): Promise<boolean>;
}
