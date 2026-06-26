import { Volunteer } from '../volunteer';
import { VolunteerId } from '../volunteer-id';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../volunteer-enums';

export const VOLUNTEER_REPOSITORY = Symbol('VolunteerRepository');

export interface VolunteerRosterFilters {
  skill?: VolunteerSkill;
  availability?: Availability;
  vehicle?: Vehicle;
  status?: VolunteerStatus;
}

export interface VolunteerRepository {
  save(volunteer: Volunteer): Promise<void>;
  findById(id: VolunteerId): Promise<Volunteer | null>;
  findByUserAndEmergency(
    userId: string,
    emergencyId: string,
  ): Promise<Volunteer | null>;
  findByEmergency(
    emergencyId: string,
    filters?: VolunteerRosterFilters,
  ): Promise<Volunteer[]>;
}
