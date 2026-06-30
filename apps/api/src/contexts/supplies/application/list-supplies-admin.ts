import {
  SupplyListFilter,
  SupplyRepository,
} from '../domain/ports/supply.repository';
import { AdminSupplyView, toAdminSupplyView } from './admin-supply-view';

/**
 * Listado de gestión del catálogo (#222): incluye archivados y campos internos,
 * con sus alias. Distinto de la cara pública (`ListSupplies` sobre el
 * read-model). Filtra por categoría, estado y búsqueda libre.
 */
export class ListSuppliesAdmin {
  constructor(private readonly repo: SupplyRepository) {}

  async execute(filter: SupplyListFilter): Promise<AdminSupplyView[]> {
    const supplies = await this.repo.list(filter);
    // Una sola consulta de alias para todo el lote (evita N+1) y agrupación en
    // memoria por insumo.
    const aliases = await this.repo.listAliasesFor(supplies.map((s) => s.id));
    const aliasesBySupply = new Map<string, typeof aliases>();
    for (const alias of aliases) {
      const list = aliasesBySupply.get(alias.supplyId);
      if (list) list.push(alias);
      else aliasesBySupply.set(alias.supplyId, [alias]);
    }
    return supplies.map((supply) =>
      toAdminSupplyView(supply, aliasesBySupply.get(supply.id) ?? []),
    );
  }
}
