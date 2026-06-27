import { approximateLocation } from './approximate-location';

const SEED_A = '11111111-1111-4111-8111-111111111111';
const SEED_B = '22222222-2222-4222-8222-222222222222';
const LAT = 10.4806;
const LNG = -66.9036;
const RADIUS = 300;

/** Returns distance in metres between two lat/lng pairs (haversine). */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

describe('approximateLocation', () => {
  describe('determinism', () => {
    it('returns the same result for the same input', () => {
      const r1 = approximateLocation(LAT, LNG, SEED_A, RADIUS);
      const r2 = approximateLocation(LAT, LNG, SEED_A, RADIUS);
      expect(r1.lat).toBe(r2.lat);
      expect(r1.lng).toBe(r2.lng);
    });

    it('returns a different result for a different seed', () => {
      const rA = approximateLocation(LAT, LNG, SEED_A, RADIUS);
      const rB = approximateLocation(LAT, LNG, SEED_B, RADIUS);
      // The two offsets should differ (probability of collision is negligible)
      expect(rA.lat === rB.lat && rA.lng === rB.lng).toBe(false);
    });

    it('is stable across multiple calls with same params', () => {
      const results = Array.from({ length: 5 }, () =>
        approximateLocation(LAT, LNG, SEED_A, RADIUS),
      );
      for (const r of results) {
        expect(r.lat).toBe(results[0].lat);
        expect(r.lng).toBe(results[0].lng);
      }
    });
  });

  describe('displacement within radius', () => {
    it('displacement is within the specified radius', () => {
      const r = approximateLocation(LAT, LNG, SEED_A, RADIUS);
      const dist = haversineMeters(LAT, LNG, r.lat, r.lng);
      expect(dist).toBeLessThanOrEqual(RADIUS);
    });

    it('displacement is within radius for a different seed', () => {
      const r = approximateLocation(LAT, LNG, SEED_B, RADIUS);
      const dist = haversineMeters(LAT, LNG, r.lat, r.lng);
      expect(dist).toBeLessThanOrEqual(RADIUS);
    });

    it('displacement is within a custom radius of 500 m', () => {
      const r = approximateLocation(LAT, LNG, SEED_A, 500);
      const dist = haversineMeters(LAT, LNG, r.lat, r.lng);
      expect(dist).toBeLessThanOrEqual(500);
    });

    it('actual displacement is non-zero (seed produces real offset)', () => {
      const r = approximateLocation(LAT, LNG, SEED_A, RADIUS);
      const dist = haversineMeters(LAT, LNG, r.lat, r.lng);
      // The offset should be at least 1 metre (i.e. not the exact same point)
      expect(dist).toBeGreaterThan(1);
    });
  });

  describe('output shape', () => {
    it('returns lat and lng as numbers', () => {
      const r = approximateLocation(LAT, LNG, SEED_A, RADIUS);
      expect(typeof r.lat).toBe('number');
      expect(typeof r.lng).toBe('number');
    });

    it('output latitude stays in valid range [-90, 90]', () => {
      const r = approximateLocation(89.9, 0, SEED_A, RADIUS);
      expect(r.lat).toBeLessThanOrEqual(90);
      expect(r.lat).toBeGreaterThanOrEqual(-90);
    });

    it('output longitude stays in plausible range', () => {
      const r = approximateLocation(0, 179.9, SEED_A, RADIUS);
      // Allow small overflow due to approximation arithmetic — the important
      // thing is that it is close to 180.
      expect(Math.abs(r.lng)).toBeLessThanOrEqual(181);
    });
  });
});
