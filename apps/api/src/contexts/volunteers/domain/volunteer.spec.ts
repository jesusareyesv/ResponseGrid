import { Volunteer } from './volunteer';
import { VolunteerId } from './volunteer-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from './volunteer-enums';
import { ConsentNotAcceptedError } from './volunteer-errors';

const EM = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const baseProps = {
  id: VolunteerId.create(),
  emergencyId: EmergencyId.fromString(EM),
  userId: USER_ID,
  name: 'Ana García',
  contact: 'ana@example.com',
  municipality: 'Valencia',
  skills: [VolunteerSkill.Medical, VolunteerSkill.Driving],
  availability: Availability.Immediate,
  vehicle: Vehicle.Car,
  consentAccepted: true,
};

describe('Volunteer aggregate', () => {
  it('registers with status available when consent is accepted', () => {
    const v = Volunteer.register(baseProps);
    expect(v.status).toBe(VolunteerStatus.Available);
    expect(v.consentAccepted).toBe(true);
    expect(v.name).toBe('Ana García');
    expect(v.skills).toEqual([VolunteerSkill.Medical, VolunteerSkill.Driving]);
  });

  it('throws ConsentNotAcceptedError when consentAccepted is false', () => {
    expect(() =>
      Volunteer.register({ ...baseProps, consentAccepted: false }),
    ).toThrow(ConsentNotAcceptedError);
  });

  it('allows empty skills array', () => {
    const v = Volunteer.register({ ...baseProps, skills: [] });
    expect(v.skills).toEqual([]);
  });

  it('changeStatus transitions to assigned', () => {
    const v = Volunteer.register(baseProps);
    v.changeStatus(VolunteerStatus.Assigned);
    expect(v.status).toBe(VolunteerStatus.Assigned);
  });

  it('changeStatus transitions to inactive', () => {
    const v = Volunteer.register(baseProps);
    v.changeStatus(VolunteerStatus.Inactive);
    expect(v.status).toBe(VolunteerStatus.Inactive);
  });

  it('updateProfile changes mutable fields', () => {
    const v = Volunteer.register(baseProps);
    v.updateProfile({
      name: 'Ana Pérez',
      contact: 'anap@example.com',
      municipality: 'Madrid',
      skills: [VolunteerSkill.Cooking],
      availability: Availability.Flexible,
      vehicle: Vehicle.Van,
    });
    expect(v.name).toBe('Ana Pérez');
    expect(v.contact).toBe('anap@example.com');
    expect(v.municipality).toBe('Madrid');
    expect(v.skills).toEqual([VolunteerSkill.Cooking]);
    expect(v.availability).toBe(Availability.Flexible);
    expect(v.vehicle).toBe(Vehicle.Van);
  });

  it('round-trips through snapshot', () => {
    const v = Volunteer.register(baseProps);
    v.changeStatus(VolunteerStatus.Assigned);
    const snap = v.toSnapshot();
    const restored = Volunteer.fromSnapshot(snap);
    expect(restored.id.value).toBe(v.id.value);
    expect(restored.emergencyId.value).toBe(EM);
    expect(restored.userId).toBe(USER_ID);
    expect(restored.status).toBe(VolunteerStatus.Assigned);
    expect(restored.skills).toEqual([
      VolunteerSkill.Medical,
      VolunteerSkill.Driving,
    ]);
    expect(restored.consentAccepted).toBe(true);
  });

  it('skills array is defensive copy (mutation does not affect aggregate)', () => {
    const v = Volunteer.register(baseProps);
    const skills = v.skills;
    skills.push(VolunteerSkill.Admin);
    expect(v.skills).toHaveLength(2);
  });
});
