import { Module } from '@nestjs/common';
import {
  GEOCODING_PROVIDER,
  GeocodingProvider,
} from '../domain/ports/geocoding.provider';
import { NominatimGeocodingProvider } from './nominatim-geocoding.provider';
import { SearchAddress } from '../application/search-address';
import { GeocodingController } from './http/geocoding.controller';

const nominatimProvider = {
  provide: GEOCODING_PROVIDER,
  useFactory: (): GeocodingProvider => new NominatimGeocodingProvider(),
};

const searchAddressProvider = {
  provide: SearchAddress,
  inject: [GEOCODING_PROVIDER],
  useFactory: (provider: GeocodingProvider) => new SearchAddress(provider),
};

@Module({
  controllers: [GeocodingController],
  providers: [nominatimProvider, searchAddressProvider],
})
export class GeocodingModule {}
