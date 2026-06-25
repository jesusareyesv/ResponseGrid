import { NeedRepository } from '../domain/ports/need.repository';
import { EventBus } from '../domain/ports/event-bus';
import { Need } from '../domain/need';
import { NeedId } from '../domain/need-id';
import { EmergencyId } from '../domain/emergency-id';
import { NeedCategory, Priority } from '../domain/need-enums';

export interface CreateNeedCommand {
  emergencyId: string;
  title: string;
  category: NeedCategory;
  priority: Priority;
  requestedQuantity: number | null;
  unit: string | null;
}

export class CreateNeed {
  constructor(
    private readonly repo: NeedRepository,
    private readonly bus: EventBus,
  ) {}

  async execute(cmd: CreateNeedCommand): Promise<{ id: string }> {
    const need = Need.create({
      id: NeedId.create(),
      emergencyId: EmergencyId.fromString(cmd.emergencyId),
      title: cmd.title,
      category: cmd.category,
      priority: cmd.priority,
      requestedQuantity: cmd.requestedQuantity,
      unit: cmd.unit,
    });
    await this.repo.save(need);
    await this.bus.publish(need.pullDomainEvents());
    return { id: need.id.value };
  }
}
