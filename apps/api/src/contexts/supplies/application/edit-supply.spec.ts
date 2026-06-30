import { EditSupply } from './edit-supply';
import { Supply } from '../domain/supply';
import {
  SupplyNotFoundError,
  SupplyVariantCycleError,
} from '../domain/supply-errors';
import { SupplyRepository } from '../domain/ports/supply.repository';

const ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function existing(): Supply {
  return Supply.create({
    id: ID,
    code: 'INS-0001',
    name: 'Agua',
    categorySlug: 'water',
    defaultUnit: 'litros',
  });
}

function makeRepo(found: Supply | null, save: jest.Mock): SupplyRepository {
  return {
    findById: jest.fn().mockResolvedValue(found),
    findByCode: jest.fn().mockResolvedValue(null),
    save,
    allocateCode: jest.fn().mockResolvedValue('INS-0212'),
    list: jest.fn().mockResolvedValue([]),
    listAliases: jest.fn().mockResolvedValue([]),
    listAliasesFor: jest.fn().mockResolvedValue([]),
    addAlias: jest.fn().mockResolvedValue(undefined),
    removeAlias: jest.fn().mockResolvedValue(undefined),
    merge: jest.fn().mockResolvedValue(undefined),
  };
}

describe('EditSupply', () => {
  it('aplica sólo los campos provistos y conserva code', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const repo = makeRepo(existing(), save);
    await new EditSupply(repo).execute({ id: ID, name: 'Agua mineral' });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const saved = save.mock.calls[0][0] as Supply;
    expect(saved.name).toBe('Agua mineral');
    expect(saved.categorySlug).toBe('water'); // intacto
    expect(saved.code).toBe('INS-0001');
  });

  it('lanza SupplyNotFoundError si no existe', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const repo = makeRepo(null, save);
    await expect(
      new EditSupply(repo).execute({ id: ID, name: 'X' }),
    ).rejects.toBeInstanceOf(SupplyNotFoundError);
    expect(save).not.toHaveBeenCalled();
  });

  it('rechaza que un insumo sea variante de sí mismo', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const repo = makeRepo(existing(), save);
    await expect(
      new EditSupply(repo).execute({ id: ID, variantOfId: ID }),
    ).rejects.toBeInstanceOf(SupplyVariantCycleError);
    expect(save).not.toHaveBeenCalled();
  });

  it('rechaza un ciclo de variantes A->B->A', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const a = existing(); // A, sin padre
    const b = Supply.create({
      id: B_ID,
      code: 'INS-0002',
      name: 'Agua 1.5L',
      categorySlug: 'water',
      defaultUnit: null,
      variantOfId: ID, // B ya es variante de A
    });
    const byId: Record<string, Supply> = { [ID]: a, [B_ID]: b };
    const repo = makeRepo(a, save);
    repo.findById = jest.fn((id: string) => Promise.resolve(byId[id] ?? null));
    // Intentar hacer A variante de B cerraría el ciclo A->B->A.
    await expect(
      new EditSupply(repo).execute({ id: ID, variantOfId: B_ID }),
    ).rejects.toBeInstanceOf(SupplyVariantCycleError);
    expect(save).not.toHaveBeenCalled();
  });
});
