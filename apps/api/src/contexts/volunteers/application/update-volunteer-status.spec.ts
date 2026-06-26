import { UpdateVolunteerStatus } from './update-volunteer-status';
import { InMemoryVolunteerRepository } from '../infrastructure/in-memory-volunteer.repository';
import { Volunteer } from '../domain/volunteer';
import { VolunteerId } from '../domain/volunteer-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../domain/volunteer-enums';
import { VolunteerNotFoundError } from '../domain/volunteer-errors';

const EM = '11111111-1111-4111-8111-111111111111';

describe('UpdateVolunteerStatus', () => {
  it('changes the volunteer status', async () => {
    const repo = new InMemoryVolunteerRepository();
    const v = Volunteer.register({
      id: VolunteerId.create(),
      emergencyId: EmergencyId.fromString(EM),
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Test',
      contact: 't@t.com',
      municipality: 'Madrid',
      skills: [VolunteerSkill.General],
      availability: Availability.Flexible,
      vehicle: Vehicle.None,
      consentAccepted: true,
    });
    await repo.save(v);
    const uc = new UpdateVolunteerStatus(repo);
    await uc.execute({
      volunteerId: v.id.value,
      status: VolunteerStatus.Assigned,
    });
    const updated = await repo.findById(v.id);
    expect(updated?.status).toBe(VolunteerStatus.Assigned);
  });

  it('throws VolunteerNotFoundError for unknown id', async () => {
    const repo = new InMemoryVolunteerRepository();
    const uc = new UpdateVolunteerStatus(repo);
    await expect(
      uc.execute({
        volunteerId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        status: VolunteerStatus.Inactive,
      }),
    ).rejects.toThrow(VolunteerNotFoundError);
  });
});
