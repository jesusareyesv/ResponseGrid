/**
 * Shared Kernel — Approximate Location helper.
 *
 * Pure function that applies a deterministic offset to a pair of coordinates
 * based on a seed string (e.g. needId). The same seed always produces the same
 * approximate point, which prevents correlation attacks across multiple
 * responses (the offset never changes between requests).
 *
 * Design: the seed is hashed (SHA-256), the first 8 bytes are extracted to
 * derive a fixed angle [0, 2π) and a fixed distance [0, radiusMeters).
 * Coordinate arithmetic uses the equirectangular approximation which is
 * accurate enough at sub-kilometer scales.
 *
 * This function lives in shared/domain but has no framework dependency — it
 * only uses node:crypto which is available in all Node.js environments and
 * does NOT make this file I/O or infra. It stays in the domain layer because
 * "approximating a location deterministically" is a pure domain concept with
 * no side effects.
 */
import { createHash } from 'node:crypto';

const EARTH_RADIUS_METERS = 6_371_000;
const DEG_PER_RAD = 180 / Math.PI;

/**
 * Derive a deterministic approximate location from exact coordinates and a
 * seed string.
 *
 * @param lat         Exact latitude in degrees
 * @param lng         Exact longitude in degrees
 * @param seed        Deterministic seed (e.g. needId UUID string)
 * @param radiusMeters Maximum displacement in meters (default 300 m)
 * @returns Approximated latitude and longitude as plain numbers
 */
export function approximateLocation(
  lat: number,
  lng: number,
  seed: string,
  radiusMeters = 300,
): { lat: number; lng: number } {
  // SHA-256 of the seed → 32 bytes of deterministic entropy
  const hash = createHash('sha256').update(seed).digest();

  // Bytes 0-3 → angle fraction in [0, 1)
  const angleFraction = hash.readUInt32BE(0) / 0x1_0000_0000;
  // Bytes 4-7 → distance fraction in [0, 1)
  const distFraction = hash.readUInt32BE(4) / 0x1_0000_0000;

  const angleRad = angleFraction * 2 * Math.PI;
  // Use square-root distribution so the point is uniformly distributed inside
  // the circle rather than concentrated near the centre.
  const distanceMeters = Math.sqrt(distFraction) * radiusMeters;

  // Convert distance to degree offsets
  const deltaLat =
    ((distanceMeters * Math.cos(angleRad)) / EARTH_RADIUS_METERS) * DEG_PER_RAD;
  const deltaLng =
    ((distanceMeters * Math.sin(angleRad)) /
      (EARTH_RADIUS_METERS * Math.cos((lat * Math.PI) / 180))) *
    DEG_PER_RAD;

  return {
    lat: lat + deltaLat,
    lng: lng + deltaLng,
  };
}
