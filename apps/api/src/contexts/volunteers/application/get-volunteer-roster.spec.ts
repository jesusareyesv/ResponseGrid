import { GetVolunteerRoster } from './get-volunteer-roster';
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

const EM = '11111111-1111-4111-8111-111111111111';

function makeVolunteer(
  overrides: Partial<{
    userId: string;
    skills: VolunteerSkill[];
    availability: Availability;
    vehicle: Vehicle;
    status: VolunteerStatus;
  }> = {},
): Volunteer {
  const v = Volunteer.register({
    id: VolunteerId.create(),
    emergencyId: EmergencyId.fromString(EM),
    userId: overrides.userId ?? 'user-' + Math.random(),
    name: 'Test',
    contact: 'test@example.com',
    municipality: 'Valencia',
    skills: overrides.skills ?? [VolunteerSkill.General],
    availability: overrides.availability ?? Availability.Flexible,
    vehicle: overrides.vehicle ?? Vehicle.None,
    consentAccepted: true,
  });
  if (overrides.status && overrides.status !== VolunteerStatus.Available) {
    v.changeStatus(overrides.status);
  }
  return v;
}

describe('GetVolunteerRoster', () => {
  it('returns all volunteers when no filters', async () => {
    const repo = new InMemoryVolunteerRepository();
    await repo.save(makeVolunteer());
    await repo.save(makeVolunteer());
    const uc = new GetVolunteerRoster(repo);
    const result = await uc.execute({ emergencyId: EM });
    expect(result).toHaveLength(2);
  });

  it('filters by skill', async () => {
    const repo = new InMemoryVolunteerRepository();
    await repo.save(makeVolunteer({ skills: [VolunteerSkill.Medical] }));
    await repo.save(makeVolunteer({ skills: [VolunteerSkill.Cooking] }));
    const uc = new GetVolunteerRoster(repo);
    const result = await uc.execute({
      emergencyId: EM,
      filters: { skill: VolunteerSkill.Medical },
    });
    expect(result).toHaveLength(1);
    expect(result[0].skills).toContain(VolunteerSkill.Medical);
  });

  it('filters by availability', async () => {
    const repo = new InMemoryVolunteerRepository();
    await repo.save(makeVolunteer({ availability: Availability.Immediate }));
    await repo.save(makeVolunteer({ availability: Availability.ThisWeek }));
    const uc = new GetVolunteerRoster(repo);
    const result = await uc.execute({
      emergencyId: EM,
      filters: { availability: Availability.Immediate },
    });
    expect(result).toHaveLength(1);
    expect(result[0].availability).toBe(Availability.Immediate);
  });

  it('filters by vehicle', async () => {
    const repo = new InMemoryVolunteerRepository();
    await repo.save(makeVolunteer({ vehicle: Vehicle.Van }));
    await repo.save(makeVolunteer({ vehicle: Vehicle.None }));
    const uc = new GetVolunteerRoster(repo);
    const result = await uc.execute({
      emergencyId: EM,
      filters: { vehicle: Vehicle.Van },
    });
    expect(result).toHaveLength(1);
    expect(result[0].vehicle).toBe(Vehicle.Van);
  });

  it('filters by status', async () => {
    const repo = new InMemoryVolunteerRepository();
    await repo.save(makeVolunteer({ status: VolunteerStatus.Assigned }));
    await repo.save(makeVolunteer({ status: VolunteerStatus.Available }));
    const uc = new GetVolunteerRoster(repo);
    const result = await uc.execute({
      emergencyId: EM,
      filters: { status: VolunteerStatus.Assigned },
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(VolunteerStatus.Assigned);
  });
});
