import { Slug } from './slug';

describe('Slug', () => {
  describe('fromString', () => {
    it('accepts a valid slug', () => {
      const s = Slug.fromString('emergencia-sismica');
      expect(s.value).toBe('emergencia-sismica');
    });

    it('accepts a slug with numbers', () => {
      const s = Slug.fromString('emergency-2024');
      expect(s.value).toBe('emergency-2024');
    });

    it('rejects a slug with uppercase letters', () => {
      expect(() => Slug.fromString('Emergencia')).toThrow();
    });

    it('rejects a slug with spaces', () => {
      expect(() => Slug.fromString('emergencia sismica')).toThrow();
    });

    it('rejects a slug with leading hyphen', () => {
      expect(() => Slug.fromString('-emergencia')).toThrow();
    });

    it('rejects a slug with trailing hyphen', () => {
      expect(() => Slug.fromString('emergencia-')).toThrow();
    });

    it('rejects an empty string', () => {
      expect(() => Slug.fromString('')).toThrow();
    });
  });

  describe('fromName', () => {
    it('normalizes "Emergencia sísmica — Venezuela" to "emergencia-sismica-venezuela"', () => {
      const s = Slug.fromName('Emergencia sísmica — Venezuela');
      expect(s.value).toBe('emergencia-sismica-venezuela');
    });

    it('normalizes "Test 123" to "test-123"', () => {
      const s = Slug.fromName('Test 123');
      expect(s.value).toBe('test-123');
    });

    it('strips accents from name', () => {
      const s = Slug.fromName('Inundación');
      expect(s.value).toBe('inundacion');
    });

    it('collapses multiple hyphens', () => {
      const s = Slug.fromName('Flood -- Emergency');
      expect(s.value).toBe('flood-emergency');
    });
  });

  describe('equals', () => {
    it('returns true for same value', () => {
      const a = Slug.fromString('flood');
      const b = Slug.fromString('flood');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different values', () => {
      const a = Slug.fromString('flood');
      const b = Slug.fromString('fire');
      expect(a.equals(b)).toBe(false);
    });
  });
});
