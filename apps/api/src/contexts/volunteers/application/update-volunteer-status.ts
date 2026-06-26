import { VolunteerRepository } from '../domain/ports/volunteer.repository';
import { VolunteerStatus } from '../domain/volunteer-enums';
import { VolunteerNotFoundError } from '../domain/volunteer-errors';
import { VolunteerId } from '../domain/volunteer-id';

export interface UpdateVolunteerStatusCommand {
  volunteerId: string;
  status: VolunteerStatus;
}

export class UpdateVolunteerStatus {
  constructor(private readonly repo: VolunteerRepository) {}

  async execute(cmd: UpdateVolunteerStatusCommand): Promise<void> {
    const volunteer = await this.repo.findById(
      VolunteerId.fromString(cmd.volunteerId),
    );
    if (!volunteer) {
      throw new VolunteerNotFoundError(cmd.volunteerId);
    }
    volunteer.changeStatus(cmd.status);
    await this.repo.save(volunteer);
  }
}
