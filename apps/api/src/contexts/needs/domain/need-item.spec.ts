import { NeedItem, NeedItemValidationError } from './need-item';
import { NeedCategory } from './need-enums';

describe('NeedItem value object', () => {
  it('creates a valid item', () => {
    const item = NeedItem.create({
      name: 'Water bottles',
      quantity: 50,
      unit: 'liters',
      category: NeedCategory.Water,
    });
    expect(item.name).toBe('Water bottles');
    expect(item.quantity).toBe(50);
    expect(item.unit).toBe('liters');
    expect(item.category).toBe(NeedCategory.Water);
  });

  it('trims whitespace from name', () => {
    const item = NeedItem.create({
      name: '  Blankets  ',
      quantity: 10,
      unit: null,
      category: NeedCategory.Shelter,
    });
    expect(item.name).toBe('Blankets');
  });

  it('allows null unit', () => {
    const item = NeedItem.create({
      name: 'Food',
      quantity: 1,
      unit: null,
      category: NeedCategory.Food,
    });
    expect(item.unit).toBeNull();
  });

  it('throws NeedItemValidationError for empty name', () => {
    expect(() =>
      NeedItem.create({
        name: '',
        quantity: 1,
        unit: null,
        category: NeedCategory.Food,
      }),
    ).toThrow(NeedItemValidationError);
  });

  it('throws NeedItemValidationError for whitespace-only name', () => {
    expect(() =>
      NeedItem.create({
        name: '  ',
        quantity: 1,
        unit: null,
        category: NeedCategory.Food,
      }),
    ).toThrow(NeedItemValidationError);
  });

  it('throws NeedItemValidationError for quantity 0', () => {
    expect(() =>
      NeedItem.create({
        name: 'Food',
        quantity: 0,
        unit: null,
        category: NeedCategory.Food,
      }),
    ).toThrow(NeedItemValidationError);
  });

  it('throws NeedItemValidationError for negative quantity', () => {
    expect(() =>
      NeedItem.create({
        name: 'Food',
        quantity: -1,
        unit: null,
        category: NeedCategory.Food,
      }),
    ).toThrow(NeedItemValidationError);
  });

  it('throws NeedItemValidationError for non-integer quantity', () => {
    expect(() =>
      NeedItem.create({
        name: 'Food',
        quantity: 1.5,
        unit: null,
        category: NeedCategory.Food,
      }),
    ).toThrow(NeedItemValidationError);
  });

  it('toSnapshot/fromSnapshot round-trip', () => {
    const original = NeedItem.create({
      name: 'Medical kits',
      quantity: 5,
      unit: 'kits',
      category: NeedCategory.Medical,
    });
    const restored = NeedItem.fromSnapshot(original.toSnapshot());
    expect(restored.name).toBe('Medical kits');
    expect(restored.quantity).toBe(5);
    expect(restored.unit).toBe('kits');
    expect(restored.category).toBe(NeedCategory.Medical);
  });
});
