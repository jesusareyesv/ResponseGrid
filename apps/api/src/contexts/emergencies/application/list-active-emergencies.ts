import { EmergencyRepository } from '../domain/ports/emergency.repository';
import { EmergencyView, toEmergencyView } from './emergency-view';

export class ListActiveEmergencies {
  constructor(private readonly repo: EmergencyRepository) {}

  async execute(): Promise<EmergencyView[]> {
    const emergencies = await this.repo.listActive();
    return emergencies.map(toEmergencyView);
  }
}
