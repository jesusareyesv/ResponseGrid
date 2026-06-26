import {
  VolunteerRepository,
  VolunteerRosterFilters,
} from '../domain/ports/volunteer.repository';
import { Volunteer } from '../domain/volunteer';
import { VolunteerId } from '../domain/volunteer-id';

export class InMemoryVolunteerRepository implements VolunteerRepository {
  private store = new Map<string, ReturnType<Volunteer['toSnapshot']>>();

  save(volunteer: Volunteer): Promise<void> {
    this.store.set(volunteer.id.value, volunteer.toSnapshot());
    return Promise.resolve();
  }

  findById(id: VolunteerId): Promise<Volunteer | null> {
    const snap = this.store.get(id.value);
    return Promise.resolve(snap ? Volunteer.fromSnapshot(snap) : null);
  }

  findByUserAndEmergency(
    userId: string,
    emergencyId: string,
  ): Promise<Volunteer | null> {
    const found = [...this.store.values()].find(
      (s) => s.userId === userId && s.emergencyId === emergencyId,
    );
    return Promise.resolve(found ? Volunteer.fromSnapshot(found) : null);
  }

  findByEmergency(
    emergencyId: string,
    filters?: VolunteerRosterFilters,
  ): Promise<Volunteer[]> {
    let result = [...this.store.values()].filter(
      (s) => s.emergencyId === emergencyId,
    );
    if (filters?.skill !== undefined) {
      result = result.filter((s) => s.skills.includes(filters.skill!));
    }
    if (filters?.availability !== undefined) {
      result = result.filter((s) => s.availability === filters.availability);
    }
    if (filters?.vehicle !== undefined) {
      result = result.filter((s) => s.vehicle === filters.vehicle);
    }
    if (filters?.status !== undefined) {
      result = result.filter((s) => s.status === filters.status);
    }
    return Promise.resolve(result.map((s) => Volunteer.fromSnapshot(s)));
  }
}
