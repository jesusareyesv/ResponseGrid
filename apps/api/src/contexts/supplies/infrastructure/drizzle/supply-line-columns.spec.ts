import {
  rowToSupplyLineSnapshot,
  supplyLineToColumns,
  SupplyLineRow,
} from './supply-line-columns';
import { Category } from '../../domain/category';
import { SupplyLineSnapshot } from '../../domain/supply-line';

describe('supply-line columns mappers', () => {
  const baseRow: SupplyLineRow = {
    name: 'Agua embotellada',
    quantity: 10,
    unit: 'L',
    category: 'water',
    presentation: 'pack 6',
    expiresAt: null,
    supplyId: null,
  };

  it('round-trips supplyId from row to snapshot', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const snap = rowToSupplyLineSnapshot({ ...baseRow, supplyId: id });
    expect(snap.supplyId).toBe(id);
  });

  it('exposes a null supplyId for a legacy free-text row', () => {
    const snap = rowToSupplyLineSnapshot(baseRow);
    expect(snap.supplyId).toBeNull();
  });

  it('persists the supplyId of a cataloged snapshot', () => {
    const id = '22222222-2222-4222-8222-222222222222';
    const snap: SupplyLineSnapshot = {
      name: 'Agua embotellada',
      quantity: 10,
      unit: 'L',
      category: Category.Water,
      presentation: null,
      expiresAt: null,
      supplyId: id,
    };
    expect(supplyLineToColumns(snap).supplyId).toBe(id);
  });

  it('writes a null supplyId when the snapshot omits the soft link', () => {
    const snap: SupplyLineSnapshot = {
      name: 'Otro',
      quantity: 1,
      unit: null,
      category: Category.Other,
      presentation: null,
      expiresAt: null,
    };
    expect(supplyLineToColumns(snap).supplyId).toBeNull();
  });
});
