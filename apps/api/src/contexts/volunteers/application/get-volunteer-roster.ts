import {
  VolunteerRepository,
  VolunteerRosterFilters,
} from '../domain/ports/volunteer.repository';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../domain/volunteer-enums';
import { VolunteerSnapshot } from '../domain/volunteer';

export interface GetVolunteerRosterQuery {
  emergencyId: string;
  filters?: {
    skill?: VolunteerSkill;
    availability?: Availability;
    vehicle?: Vehicle;
    status?: VolunteerStatus;
  };
}

export class GetVolunteerRoster {
  constructor(private readonly repo: VolunteerRepository) {}

  async execute(query: GetVolunteerRosterQuery): Promise<VolunteerSnapshot[]> {
    const filters: VolunteerRosterFilters = {};
    if (query.filters?.skill !== undefined) filters.skill = query.filters.skill;
    if (query.filters?.availability !== undefined)
      filters.availability = query.filters.availability;
    if (query.filters?.vehicle !== undefined)
      filters.vehicle = query.filters.vehicle;
    if (query.filters?.status !== undefined)
      filters.status = query.filters.status;

    const volunteers = await this.repo.findByEmergency(
      query.emergencyId,
      filters,
    );
    return volunteers.map((v) => v.toSnapshot());
  }
}
