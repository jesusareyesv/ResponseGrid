import {
  GeocodeResult,
  GeocodingProvider,
} from '../domain/ports/geocoding.provider';

/** Shape of a single item returned by Nominatim JSON v2 */
interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ReliefHub/0.1 (emergency-aid-coordination)';

/**
 * Adapter that calls Nominatim (OpenStreetMap) to geocode text queries.
 *
 * Cache strategy: in-memory LRU-like map with TTL of 86 400 s (1 day).
 * This keeps Nominatim's 1 req/s rate-limit in mind for repeated queries.
 * A Redis cache would be appropriate in a multi-instance deployment; for now
 * the simplicity of an in-memory map avoids an extra REDIS dependency at
 * module level and keeps the adapter self-contained. Each running process
 * benefits from its own hot cache without coordination overhead.
 */
export class NominatimGeocodingProvider implements GeocodingProvider {
  private readonly cache = new Map<
    string,
    { results: GeocodeResult[]; expiresAt: number }
  >();
  private readonly ttlMs: number;

  constructor(ttlMs = 86_400_000 /* 1 day */) {
    this.ttlMs = ttlMs;
  }

  async search(query: string): Promise<GeocodeResult[]> {
    const cached = this.cache.get(query);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.results;
    }

    const url =
      `${NOMINATIM_BASE}/search` +
      `?format=jsonv2&addressdetails=0&limit=5&q=${encodeURIComponent(query)}`;

    let items: NominatimItem[];
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!response.ok) {
        // Non-2xx: return empty rather than crashing the user flow
        return [];
      }
      items = (await response.json()) as NominatimItem[];
    } catch {
      // Network or parse error: return empty to degrade gracefully
      return [];
    }

    const results: GeocodeResult[] = items.map((item) => ({
      address: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    }));

    this.cache.set(query, { results, expiresAt: Date.now() + this.ttlMs });

    return results;
  }
}
