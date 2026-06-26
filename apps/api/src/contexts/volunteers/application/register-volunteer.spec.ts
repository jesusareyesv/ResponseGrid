import { RegisterVolunteer } from './register-volunteer';
import { InMemoryVolunteerRepository } from '../infrastructure/in-memory-volunteer.repository';
import { VolunteerEmergencyStatusReader } from '../domain/ports/emergency-status-reader';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../domain/volunteer-enums';
import { EmergencyNotAcceptingIntakeError } from '../../emergencies/domain/emergency-not-accepting-intake.error';
import { ConsentNotAcceptedError } from '../domain/volunteer-errors';

const EM = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

class FakeStatusReader implements VolunteerEmergencyStatusReader {
  constructor(private readonly status: string | null) {}
  getStatus(_id: string): Promise<string | null> {
    return Promise.resolve(this.status);
  }
}

const activeReader = new FakeStatusReader('active');

const baseCmd = {
  emergencyId: EM,
  userId: USER_ID,
  name: 'Ana García',
  contact: 'ana@example.com',
  municipality: 'Valencia',
  skills: [VolunteerSkill.Medical] as VolunteerSkill[],
  availability: Availability.Immediate,
  vehicle: Vehicle.Car,
  consentAccepted: true,
};

describe('RegisterVolunteer', () => {
  it('creates volunteer with available status and returns id', async () => {
    const repo = new InMemoryVolunteerRepository();
    const uc = new RegisterVolunteer(repo, activeReader);
    const { id } = await uc.execute(baseCmd);
    expect(typeof id).toBe('string');
    const volunteers = await repo.findByEmergency(EM);
    expect(volunteers).toHaveLength(1);
    expect(volunteers[0].status).toBe(VolunteerStatus.Available);
  });

  it('throws EmergencyNotAcceptingIntakeError when emergency is paused', async () => {
    const repo = new InMemoryVolunteerRepository();
    const uc = new RegisterVolunteer(repo, new FakeStatusReader('paused'));
    await expect(uc.execute(baseCmd)).rejects.toThrow(
      EmergencyNotAcceptingIntakeError,
    );
  });

  it('throws EmergencyNotAcceptingIntakeError when emergency does not exist', async () => {
    const repo = new InMemoryVolunteerRepository();
    const uc = new RegisterVolunteer(repo, new FakeStatusReader(null));
    await expect(uc.execute(baseCmd)).rejects.toThrow(
      EmergencyNotAcceptingIntakeError,
    );
  });

  it('throws ConsentNotAcceptedError when consent is false', async () => {
    const repo = new InMemoryVolunteerRepository();
    const uc = new RegisterVolunteer(repo, activeReader);
    await expect(
      uc.execute({ ...baseCmd, consentAccepted: false }),
    ).rejects.toThrow(ConsentNotAcceptedError);
  });

  it('upserts when same user registers twice for same emergency', async () => {
    const repo = new InMemoryVolunteerRepository();
    const uc = new RegisterVolunteer(repo, activeReader);
    const { id: id1 } = await uc.execute(baseCmd);
    const { id: id2 } = await uc.execute({
      ...baseCmd,
      name: 'Ana Updated',
      contact: 'ana2@example.com',
    });
    expect(id1).toBe(id2);
    const volunteers = await repo.findByEmergency(EM);
    expect(volunteers).toHaveLength(1);
    expect(volunteers[0].name).toBe('Ana Updated');
  });

  it('allows different users to register for the same emergency', async () => {
    const repo = new InMemoryVolunteerRepository();
    const uc = new RegisterVolunteer(repo, activeReader);
    await uc.execute({
      ...baseCmd,
      userId: 'user-1111-1111-1111-111111111111',
    });
    await uc.execute({
      ...baseCmd,
      userId: 'user-2222-2222-2222-222222222222',
    });
    const volunteers = await repo.findByEmergency(EM);
    expect(volunteers).toHaveLength(2);
  });
});
