/**
 * Errores de gestión del catálogo maestro de insumos (#222). El dominio y la
 * aplicación los lanzan; el filtro HTTP (`supplies-domain-exception.filter.ts`)
 * los mapea a códigos de estado. `SupplyValidationError` (invariantes del
 * agregado) vive en `supply.ts`.
 */

export class SupplyNotFoundError extends Error {
  constructor(id: string) {
    super(`Supply not found: ${id}`);
    this.name = 'SupplyNotFoundError';
  }
}

export class SupplyCodeConflictError extends Error {
  constructor(code: string) {
    super(`Supply code already exists: ${code}`);
    this.name = 'SupplyCodeConflictError';
  }
}

export class SupplyVariantTargetNotFoundError extends Error {
  constructor(variantOfId: string) {
    super(`Variant target supply not found: ${variantOfId}`);
    this.name = 'SupplyVariantTargetNotFoundError';
  }
}

export class SupplyMergeIntoSelfError extends Error {
  constructor(id: string) {
    super(`Cannot merge a supply into itself: ${id}`);
    this.name = 'SupplyMergeIntoSelfError';
  }
}

export class SupplyVariantCycleError extends Error {
  constructor(id: string) {
    super(`Variant relationship would create a cycle for supply: ${id}`);
    this.name = 'SupplyVariantCycleError';
  }
}

export class SupplyAliasConflictError extends Error {
  constructor(alias: string) {
    super(`Alias already mapped to a supply: ${alias}`);
    this.name = 'SupplyAliasConflictError';
  }
}
