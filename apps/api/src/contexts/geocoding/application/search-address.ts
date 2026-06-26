import {
  GeocodeResult,
  GeocodingProvider,
} from '../domain/ports/geocoding.provider';

export interface SearchAddressQuery {
  query: string;
}

export class SearchAddress {
  constructor(private readonly provider: GeocodingProvider) {}

  async execute({ query }: SearchAddressQuery): Promise<GeocodeResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];
    return this.provider.search(trimmed);
  }
}
