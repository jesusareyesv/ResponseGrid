import { VolunteerRepository } from '../domain/ports/volunteer.repository';
import { VolunteerEmergencyStatusReader } from '../domain/ports/emergency-status-reader';
import { Volunteer } from '../domain/volunteer';
import { VolunteerId } from '../domain/volunteer-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
} from '../domain/volunteer-enums';
import { EmergencyNotAcceptingIntakeError } from '../../emergencies/domain/emergency-not-accepting-intake.error';

const ACTIVE_STATUS = 'active';

export interface RegisterVolunteerCommand {
  emergencyId: string;
  userId: string;
  name: string;
  contact: string;
  municipality: string;
  skills: VolunteerSkill[];
  availability: Availability;
  vehicle: Vehicle;
  consentAccepted: boolean;
}

export class RegisterVolunteer {
  constructor(
    private readonly repo: VolunteerRepository,
    private readonly emergencyStatusReader: VolunteerEmergencyStatusReader,
  ) {}

  async execute(cmd: RegisterVolunteerCommand): Promise<{ id: string }> {
    const status = await this.emergencyStatusReader.getStatus(cmd.emergencyId);
    if (status !== ACTIVE_STATUS) {
      throw new EmergencyNotAcceptingIntakeError(
        cmd.emergencyId,
        status ?? 'not-found',
      );
    }

    const existing = await this.repo.findByUserAndEmergency(
      cmd.userId,
      cmd.emergencyId,
    );

    if (existing) {
      // Upsert: update profile on re-registration
      existing.updateProfile({
        name: cmd.name,
        contact: cmd.contact,
        municipality: cmd.municipality,
        skills: cmd.skills,
        availability: cmd.availability,
        vehicle: cmd.vehicle,
      });
      await this.repo.save(existing);
      return { id: existing.id.value };
    }

    const volunteer = Volunteer.register({
      id: VolunteerId.create(),
      emergencyId: EmergencyId.fromString(cmd.emergencyId),
      userId: cmd.userId,
      name: cmd.name,
      contact: cmd.contact,
      municipality: cmd.municipality,
      skills: cmd.skills,
      availability: cmd.availability,
      vehicle: cmd.vehicle,
      consentAccepted: cmd.consentAccepted,
    });
    await this.repo.save(volunteer);
    return { id: volunteer.id.value };
  }
}
