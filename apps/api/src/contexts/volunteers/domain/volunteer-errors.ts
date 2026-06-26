export class ConsentNotAcceptedError extends Error {
  constructor() {
    super('Volunteer registration requires consent to be accepted');
    this.name = 'ConsentNotAcceptedError';
  }
}

export class VolunteerNotFoundError extends Error {
  constructor(volunteerId: string) {
    super(`Volunteer '${volunteerId}' not found`);
    this.name = 'VolunteerNotFoundError';
  }
}
