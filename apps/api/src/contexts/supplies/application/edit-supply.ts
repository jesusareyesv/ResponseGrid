import { Supply } from '../domain/supply';
import {
  SupplyNotFoundError,
  SupplyVariantCycleError,
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
        if (!parent)
          throw new SupplyVariantTargetNotFoundError(cmd.variantOfId);
        await this.assertNoVariantCycle(cmd.id, parent);
      }
      next = next.setVariantOf(cmd.variantOfId);
    }

    await this.repo.save(next);
  }

  /**
   * Recorre la cadena de ancestros desde el padre propuesto: si vuelve a
   * encontrar el propio insumo, la relación cerraría un ciclo (incl. el
   * auto-referencia `variantOfId === id`). El `seen` corta cadenas ya cíclicas
   * en datos para no bucle infinito.
   */
  private async assertNoVariantCycle(
    id: string,
    parent: Supply,
  ): Promise<void> {
    const seen = new Set<string>();
    let ancestor: Supply | null = parent;
    while (ancestor) {
      if (ancestor.id === id) {
        throw new SupplyVariantCycleError(id);
      }
      if (seen.has(ancestor.id)) break;
      seen.add(ancestor.id);
      ancestor = ancestor.variantOfId
        ? await this.repo.findById(ancestor.variantOfId)
        : null;
    }
  }
}
