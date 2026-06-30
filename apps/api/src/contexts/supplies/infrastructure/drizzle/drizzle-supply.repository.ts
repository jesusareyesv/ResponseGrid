import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { Db } from '../../../../shared/db';
import { Supply, SupplyStatus, formatSupplyCode } from '../../domain/supply';
import { SupplyAlias } from '../../domain/supply-alias';
import {
  SupplyAliasConflictError,
  SupplyCodeConflictError,
} from '../../domain/supply-errors';
import {
  SupplyListFilter,
  SupplyRepository,
} from '../../domain/ports/supply.repository';
import { suppliesTable, supplyAliasesTable } from './schema';

type SupplyRow = typeof suppliesTable.$inferSelect;

/** Código de violación de unicidad de Postgres. */
const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === UNIQUE_VIOLATION
  );
}

/**
 * Persistencia del agregado `Supply` (escritura / gestión interna). La cara
 * pública del catálogo se sirve aparte vía `SupplyCatalogReadModel`.
 */
export class DrizzleSupplyRepository implements SupplyRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Supply | null> {
    const [row] = await this.db
      .select()
      .from(suppliesTable)
      .where(eq(suppliesTable.id, id))
      .limit(1);
    return row ? this.toSupply(row) : null;
  }

  async findByCode(code: string): Promise<Supply | null> {
    // Búsqueda por código insensible a mayúsculas (los códigos canónicos son
    // 'INS-NNNN', pero no asumimos el casing del llamante).
    const normalized = code.trim().toLowerCase();
    const [row] = await this.db
      .select()
      .from(suppliesTable)
      .where(sql`lower(${suppliesTable.code}) = ${normalized}`)
      .limit(1);
    return row ? this.toSupply(row) : null;
  }

  async save(supply: Supply): Promise<void> {
    const s = supply.toSnapshot();
    const now = new Date();
    try {
      await this.db
        .insert(suppliesTable)
        .values({
          id: s.id,
          code: s.code,
          name: s.name,
          status: s.status,
          registrationNotes: s.registrationNotes,
          categorySlug: s.categorySlug,
          defaultUnit: s.defaultUnit,
          attributes: s.attributes,
          variantOfId: s.variantOfId,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: suppliesTable.id,
          set: {
            name: s.name,
            status: s.status,
            registrationNotes: s.registrationNotes,
            categorySlug: s.categorySlug,
            defaultUnit: s.defaultUnit,
            attributes: s.attributes,
            variantOfId: s.variantOfId,
            updatedAt: now,
          },
        });
    } catch (err) {
      // El upsert resuelve el conflicto por `id`; un 23505 restante sólo puede
      // venir del índice único de `code` → error de dominio (409) en vez de 500.
      if (isUniqueViolation(err)) {
        throw new SupplyCodeConflictError(s.code);
      }
      throw err;
    }
  }

  async allocateCode(): Promise<string> {
    // nextval devuelve bigint -> string; la secuencia se siembra por encima del
    // máximo sembrado en la migración 0040.
    const result = await this.db.execute<{ value: string }>(
      sql`SELECT nextval('supply_code_seq') AS value`,
    );
    const next = Number(result.rows[0]?.value);
    if (!Number.isInteger(next) || next < 1) {
      throw new Error('Supply code sequence allocation returned no row');
    }
    return formatSupplyCode(next);
  }

  async list(filter: SupplyListFilter): Promise<Supply[]> {
    const conditions: SQL[] = [];
    if (filter.status) {
      conditions.push(eq(suppliesTable.status, filter.status));
    }
    if (filter.categorySlug) {
      conditions.push(eq(suppliesTable.categorySlug, filter.categorySlug));
    }
    const q = filter.q?.trim();
    if (q) {
      const like = `%${q}%`;
      conditions.push(
        or(
          ilike(suppliesTable.code, like),
          ilike(suppliesTable.name, like),
        ) as SQL,
      );
    }
    const rows = await this.db
      .select()
      .from(suppliesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(suppliesTable.code));
    return rows.map((row) => this.toSupply(row));
  }

  async listAliases(supplyId: string): Promise<SupplyAlias[]> {
    return this.listAliasesFor([supplyId]);
  }

  async listAliasesFor(supplyIds: string[]): Promise<SupplyAlias[]> {
    if (supplyIds.length === 0) return [];
    const rows = await this.db
      .select()
      .from(supplyAliasesTable)
      .where(inArray(supplyAliasesTable.supplyId, supplyIds))
      .orderBy(asc(supplyAliasesTable.aliasNorm));
    return rows.map((r) =>
      SupplyAlias.fromSnapshot({ alias: r.aliasNorm, supplyId: r.supplyId }),
    );
  }

  async addAlias(alias: SupplyAlias): Promise<void> {
    const aliasNorm = SupplyAlias.normalize(alias.alias);
    // Inserción atómica: ON CONFLICT DO NOTHING + relectura evita la carrera de
    // un check-then-insert (dos altas concurrentes del mismo término → 23505).
    const inserted = await this.db
      .insert(supplyAliasesTable)
      .values({ aliasNorm, supplyId: alias.supplyId })
      .onConflictDoNothing()
      .returning({ supplyId: supplyAliasesTable.supplyId });
    if (inserted.length > 0) return;
    // Hubo conflicto: idempotente si ya apunta al mismo insumo, si no, error.
    const [existing] = await this.db
      .select()
      .from(supplyAliasesTable)
      .where(eq(supplyAliasesTable.aliasNorm, aliasNorm))
      .limit(1);
    if (existing && existing.supplyId === alias.supplyId) return;
    throw new SupplyAliasConflictError(aliasNorm);
  }

  async removeAlias(supplyId: string, aliasNorm: string): Promise<void> {
    // Borra sólo si el alias pertenece a ese insumo (respeta el scope de la ruta).
    await this.db
      .delete(supplyAliasesTable)
      .where(
        and(
          eq(supplyAliasesTable.aliasNorm, SupplyAlias.normalize(aliasNorm)),
          eq(supplyAliasesTable.supplyId, supplyId),
        ),
      );
  }

  async merge(sourceId: string, targetId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Mueve los alias de A a B. `alias_norm` es PK global (un alias mapea a un
      // solo insumo), así que A y B nunca comparten alias y el UPDATE no choca.
      await tx
        .update(supplyAliasesTable)
        .set({ supplyId: targetId })
        .where(eq(supplyAliasesTable.supplyId, sourceId));
      // Repunta las variantes hijas de A a B, excluyendo a la propia B (si B
      // era variante de A, repuntarla la dejaría apuntándose a sí misma).
      await tx
        .update(suppliesTable)
        .set({ variantOfId: targetId, updatedAt: new Date() })
        .where(
          and(
            eq(suppliesTable.variantOfId, sourceId),
            ne(suppliesTable.id, targetId),
          ),
        );
      // Si B era variante de A (se fusiona el padre en su hija), B queda como
      // raíz (no como variante del A ya archivado).
      await tx
        .update(suppliesTable)
        .set({ variantOfId: null, updatedAt: new Date() })
        .where(
          and(
            eq(suppliesTable.id, targetId),
            eq(suppliesTable.variantOfId, sourceId),
          ),
        );
      // Archiva A (no se borra: preserva referencias legadas para #223/#226).
      await tx
        .update(suppliesTable)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(eq(suppliesTable.id, sourceId));
    });
  }

  private toSupply(row: SupplyRow): Supply {
    return Supply.fromSnapshot({
      id: row.id,
      code: row.code,
      name: row.name,
      categorySlug: row.categorySlug,
      defaultUnit: row.defaultUnit ?? null,
      attributes: (row.attributes ?? {}) as Record<string, unknown>,
      variantOfId: row.variantOfId ?? null,
      status: row.status as SupplyStatus,
      registrationNotes: row.registrationNotes ?? null,
    });
  }
}
