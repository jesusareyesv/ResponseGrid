import { NeedId } from './need-id';

describe('NeedId', () => {
  it('create() generates a valid UUID', () => {
    const id = NeedId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('fromString() accepts a valid UUID', () => {
    const uuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    const id = NeedId.fromString(uuid);
    expect(id.value).toBe(uuid);
  });

  it('fromString() throws on invalid input', () => {
    expect(() => NeedId.fromString('not-a-uuid')).toThrow('Invalid NeedId');
  });

  it('equals() returns true for same value', () => {
    const uuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    expect(NeedId.fromString(uuid).equals(NeedId.fromString(uuid))).toBe(true);
  });

  it('equals() returns false for different values', () => {
    const a = NeedId.create();
    const b = NeedId.create();
    expect(a.equals(b)).toBe(false);
  });
});
