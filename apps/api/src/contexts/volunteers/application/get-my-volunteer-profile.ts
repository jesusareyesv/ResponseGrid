import { VolunteerRepository } from '../domain/ports/volunteer.repository';
import { VolunteerSnapshot } from '../domain/volunteer';

export interface GetMyVolunteerProfileQuery {
  emergencyId: string;
  userId: string;
}

export class GetMyVolunteerProfile {
  constructor(private readonly repo: VolunteerRepository) {}

  async execute(
    query: GetMyVolunteerProfileQuery,
  ): Promise<VolunteerSnapshot | null> {
    const volunteer = await this.repo.findByUserAndEmergency(
      query.userId,
      query.emergencyId,
    );
    return volunteer ? volunteer.toSnapshot() : null;
  }
}
