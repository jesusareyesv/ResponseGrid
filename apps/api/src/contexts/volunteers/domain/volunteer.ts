import { VolunteerId } from './volunteer-id';
import { EmergencyId } from '../../../shared/domain/emergency-id';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from './volunteer-enums';
import { ConsentNotAcceptedError } from './volunteer-errors';

export interface RegisterVolunteerProps {
  id: VolunteerId;
  emergencyId: EmergencyId;
  userId: string;
  name: string;
  contact: string;
  municipality: string;
  skills: VolunteerSkill[];
  availability: Availability;
  vehicle: Vehicle;
  consentAccepted: boolean;
}

export interface UpdateVolunteerProfileProps {
  name: string;
  contact: string;
  municipality: string;
  skills: VolunteerSkill[];
  availability: Availability;
  vehicle: Vehicle;
}

export interface VolunteerSnapshot {
  id: string;
  emergencyId: string;
  userId: string;
  name: string;
  contact: string;
  municipality: string;
  skills: VolunteerSkill[];
  availability: Availability;
  vehicle: Vehicle;
  status: VolunteerStatus;
  consentAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Volunteer {
  private _status: VolunteerStatus;
  private _name: string;
  private _contact: string;
  private _municipality: string;
  private _skills: VolunteerSkill[];
  private _availability: Availability;
  private _vehicle: Vehicle;
  private _updatedAt: Date;

  private constructor(
    public readonly id: VolunteerId,
    public readonly emergencyId: EmergencyId,
    public readonly userId: string,
    name: string,
    contact: string,
    municipality: string,
    skills: VolunteerSkill[],
    availability: Availability,
    vehicle: Vehicle,
    status: VolunteerStatus,
    public readonly consentAccepted: boolean,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    this._status = status;
    this._name = name;
    this._contact = contact;
    this._municipality = municipality;
    this._skills = [...skills];
    this._availability = availability;
    this._vehicle = vehicle;
    this._updatedAt = updatedAt;
  }

  get status(): VolunteerStatus {
    return this._status;
  }
  get name(): string {
    return this._name;
  }
  get contact(): string {
    return this._contact;
  }
  get municipality(): string {
    return this._municipality;
  }
  get skills(): VolunteerSkill[] {
    return [...this._skills];
  }
  get availability(): Availability {
    return this._availability;
  }
  get vehicle(): Vehicle {
    return this._vehicle;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  static register(props: RegisterVolunteerProps): Volunteer {
    if (!props.consentAccepted) {
      throw new ConsentNotAcceptedError();
    }
    const now = new Date();
    return new Volunteer(
      props.id,
      props.emergencyId,
      props.userId,
      props.name,
      props.contact,
      props.municipality,
      props.skills,
      props.availability,
      props.vehicle,
      VolunteerStatus.Available,
      true,
      now,
      now,
    );
  }

  static fromSnapshot(s: VolunteerSnapshot): Volunteer {
    return new Volunteer(
      VolunteerId.fromString(s.id),
      EmergencyId.fromString(s.emergencyId),
      s.userId,
      s.name,
      s.contact,
      s.municipality,
      [...s.skills],
      s.availability,
      s.vehicle,
      s.status,
      s.consentAccepted,
      s.createdAt,
      s.updatedAt,
    );
  }

  changeStatus(status: VolunteerStatus): void {
    this._status = status;
    this._updatedAt = new Date();
  }

  updateProfile(props: UpdateVolunteerProfileProps): void {
    this._name = props.name;
    this._contact = props.contact;
    this._municipality = props.municipality;
    this._skills = [...props.skills];
    this._availability = props.availability;
    this._vehicle = props.vehicle;
    this._updatedAt = new Date();
  }

  toSnapshot(): VolunteerSnapshot {
    return {
      id: this.id.value,
      emergencyId: this.emergencyId.value,
      userId: this.userId,
      name: this._name,
      contact: this._contact,
      municipality: this._municipality,
      skills: [...this._skills],
      availability: this._availability,
      vehicle: this._vehicle,
      status: this._status,
      consentAccepted: this.consentAccepted,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
