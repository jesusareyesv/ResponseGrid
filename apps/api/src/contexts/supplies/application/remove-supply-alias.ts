import { SupplyRepository } from '../domain/ports/supply.repository';

export interface RemoveSupplyAliasCommand {
  supplyId: string;
  aliasNorm: string;
}

/**
 * Elimina un sinónimo del catálogo (#222), sólo si pertenece al insumo de la
 * ruta. Idempotente: borrar un alias inexistente no es un error.
 */
export class RemoveSupplyAlias {
  constructor(private readonly repo: SupplyRepository) {}

  async execute(cmd: RemoveSupplyAliasCommand): Promise<void> {
    await this.repo.removeAlias(cmd.supplyId, cmd.aliasNorm);
  }
}
