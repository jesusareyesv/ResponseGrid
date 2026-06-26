import { AccreditationRepository } from '../domain/ports/accreditation.repository';

export class AccreditationNotFoundError extends Error {
  constructor(id: string) {
    super(`Accreditation not found: ${id}`);
    this.name = 'AccreditationNotFoundError';
  }
}

export interface RevokeAccreditationCommand {
  accreditationId: string;
}

export class RevokeAccreditation {
  constructor(private readonly repo: AccreditationRepository) {}

  async execute(cmd: RevokeAccreditationCommand): Promise<void> {
    const existing = await this.repo.findById(cmd.accreditationId);
    if (!existing) throw new AccreditationNotFoundError(cmd.accreditationId);
    await this.repo.delete(cmd.accreditationId);
  }
}
