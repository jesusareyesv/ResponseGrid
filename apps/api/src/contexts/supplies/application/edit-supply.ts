import { Supply } from '../domain/supply';
import {
  SupplyNotFoundError,
  SupplyVariantTargetNotFoundError,
} from '../domain/supply-errors';
import { SupplyRepository } from '../domain/ports/supply.repository';

export interface EditSupplyCommand {
  id: string;
  name?: string;
  categorySlug?: string;
  defaultUnit?: string | null;
  attributes?: Record<string, unknown>;
  registrationNotes?: string | null;
  variantOfId?: string | null;
}

/**
 * Edición de un insumo (#222). Aplica sólo los campos provistos vía los
 * mutadores inmutables del agregado. `code` no es editable.
 */
export class EditSupply {
  constructor(private readonly repo: SupplyRepository) {}

  async execute(cmd: EditSupplyCommand): Promise<void> {
    const current = await this.repo.findById(cmd.id);
    if (!current) {
      throw new SupplyNotFoundError(cmd.id);
    }

    let next: Supply = current;
    if (cmd.name !== undefined) next = next.rename(cmd.name);
    if (cmd.categorySlug !== undefined)
      next = next.recategorize(cmd.categorySlug);
    if (cmd.defaultUnit !== undefined)
      next = next.setDefaultUnit(cmd.defaultUnit);
    if (cmd.attributes !== undefined) next = next.setAttributes(cmd.attributes);
    if (cmd.registrationNotes !== undefined) {
      next = next.setRegistrationNotes(cmd.registrationNotes);
    }
    if (cmd.variantOfId !== undefined) {
      if (cmd.variantOfId) {
        const parent = await this.repo.findById(cmd.variantOfId);
        if (!parent) throw new SupplyVariantTargetNotFoundError(cmd.variantOfId);
      }
      next = next.setVariantOf(cmd.variantOfId);
    }

    await this.repo.save(next);
  }
}
