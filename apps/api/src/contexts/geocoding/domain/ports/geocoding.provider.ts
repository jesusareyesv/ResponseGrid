export const GEOCODING_PROVIDER = Symbol('GeocodingProvider');

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
}

export interface GeocodingProvider {
  search(query: string): Promise<GeocodeResult[]>;
}
