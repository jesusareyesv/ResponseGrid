import { EmergencyRepository } from '../domain/ports/emergency.repository';
import { Slug } from '../domain/slug';
import { EmergencyView, toEmergencyView } from './emergency-view';

export class GetEmergencyBySlug {
  constructor(private readonly repo: EmergencyRepository) {}

  async execute(q: { slug: string }): Promise<EmergencyView | null> {
    const slug = Slug.fromString(q.slug);
    const emergency = await this.repo.findBySlug(slug);
    return emergency ? toEmergencyView(emergency) : null;
  }
}
