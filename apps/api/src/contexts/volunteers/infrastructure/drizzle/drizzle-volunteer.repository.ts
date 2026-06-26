import { and, eq } from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { volunteersTable } from './schema';
import {
  VolunteerRepository,
  VolunteerRosterFilters,
} from '../../domain/ports/volunteer.repository';
import { Volunteer, VolunteerSnapshot } from '../../domain/volunteer';
import { VolunteerId } from '../../domain/volunteer-id';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../../domain/volunteer-enums';

type Row = typeof volunteersTable.$inferSelect;

function rowToSnapshot(row: Row): VolunteerSnapshot {
  return {
    id: row.id,
    emergencyId: row.emergencyId,
    userId: row.userId,
    name: row.name,
    contact: row.contact,
    municipality: row.municipality,
    skills: (row.skills ?? []) as VolunteerSkill[],
    availability: row.availability as Availability,
    vehicle: row.vehicle as Vehicle,
    status: row.status as VolunteerStatus,
    consentAccepted: row.consentAccepted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleVolunteerRepository implements VolunteerRepository {
  constructor(private readonly db: Db) {}

  async save(volunteer: Volunteer): Promise<void> {
    const s = volunteer.toSnapshot();
    await this.db
      .insert(volunteersTable)
      .values({
        id: s.id,
        emergencyId: s.emergencyId,
        userId: s.userId,
        name: s.name,
        contact: s.contact,
        municipality: s.municipality,
        skills: s.skills,
        availability: s.availability,
        vehicle: s.vehicle,
        status: s.status,
        consentAccepted: s.consentAccepted,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })
      .onConflictDoUpdate({
        target: volunteersTable.id,
        set: {
          name: s.name,
          contact: s.contact,
          municipality: s.municipality,
          skills: s.skills,
          availability: s.availability,
          vehicle: s.vehicle,
          status: s.status,
          updatedAt: s.updatedAt,
        },
      });
  }

  async findById(id: VolunteerId): Promise<Volunteer | null> {
    const rows = await this.db
      .select()
      .from(volunteersTable)
      .where(eq(volunteersTable.id, id.value))
      .limit(1);
    return rows[0] ? Volunteer.fromSnapshot(rowToSnapshot(rows[0])) : null;
  }

  async findByUserAndEmergency(
    userId: string,
    emergencyId: string,
  ): Promise<Volunteer | null> {
    const rows = await this.db
      .select()
      .from(volunteersTable)
      .where(
        and(
          eq(volunteersTable.userId, userId),
          eq(volunteersTable.emergencyId, emergencyId),
        ),
      )
      .limit(1);
    return rows[0] ? Volunteer.fromSnapshot(rowToSnapshot(rows[0])) : null;
  }

  async findByEmergency(
    emergencyId: string,
    filters?: VolunteerRosterFilters,
  ): Promise<Volunteer[]> {
    const conditions = [eq(volunteersTable.emergencyId, emergencyId)];
    if (filters?.availability !== undefined) {
      conditions.push(eq(volunteersTable.availability, filters.availability));
    }
    if (filters?.vehicle !== undefined) {
      conditions.push(eq(volunteersTable.vehicle, filters.vehicle));
    }
    if (filters?.status !== undefined) {
      conditions.push(eq(volunteersTable.status, filters.status));
    }

    const rows = await this.db
      .select()
      .from(volunteersTable)
      .where(and(...conditions));

    let results = rows.map((r) => Volunteer.fromSnapshot(rowToSnapshot(r)));

    // skill filter is applied in-memory (array contains)
    if (filters?.skill !== undefined) {
      const skill = filters.skill;
      results = results.filter((v) => v.skills.includes(skill));
    }

    return results;
  }
}
