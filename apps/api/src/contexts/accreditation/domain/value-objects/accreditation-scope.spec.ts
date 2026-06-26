import { AccreditationScope } from './accreditation-scope';

describe('AccreditationScope', () => {
  describe('global()', () => {
    it('isGlobal is true', () => {
      expect(AccreditationScope.global().isGlobal).toBe(true);
    });
    it('emergencyId is null', () => {
      expect(AccreditationScope.global().emergencyId).toBeNull();
    });
    it('toDb returns null', () => {
      expect(AccreditationScope.global().toDb()).toBeNull();
    });
    it('coversEmergency is true for any id', () => {
      expect(
        AccreditationScope.global().coversEmergency('any-emergency-id'),
      ).toBe(true);
    });
  });

  describe('forEmergency()', () => {
    const id = 'em-1';
    it('isGlobal is false', () => {
      expect(AccreditationScope.forEmergency(id).isGlobal).toBe(false);
    });
    it('emergencyId returns the id', () => {
      expect(AccreditationScope.forEmergency(id).emergencyId).toBe(id);
    });
    it('toDb returns the id', () => {
      expect(AccreditationScope.forEmergency(id).toDb()).toBe(id);
    });
    it('coversEmergency returns true for matching id', () => {
      expect(AccreditationScope.forEmergency(id).coversEmergency(id)).toBe(
        true,
      );
    });
    it('coversEmergency returns false for non-matching id', () => {
      expect(AccreditationScope.forEmergency(id).coversEmergency('other')).toBe(
        false,
      );
    });
    it('throws on empty emergencyId', () => {
      expect(() => AccreditationScope.forEmergency('')).toThrow();
    });
  });

  describe('fromProps()', () => {
    it('creates global from global props', () => {
      const s = AccreditationScope.fromProps({ kind: 'global' });
      expect(s.isGlobal).toBe(true);
    });
    it('creates emergency from emergency props', () => {
      const s = AccreditationScope.fromProps({
        kind: 'emergency',
        emergencyId: 'em-2',
      });
      expect(s.emergencyId).toBe('em-2');
    });
  });
});
