import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SearchAddress } from '../../application/search-address';
import { GeocodeResultDto } from './geocode-result.dto';
import { GeocodeResult } from '../../domain/ports/geocoding.provider';

@ApiTags('geocoding')
@Controller('geocode')
export class GeocodingController {
  constructor(private readonly searchAddress: SearchAddress) {}

  @Get()
  @ApiOperation({
    summary: 'Geocode a free-text address query (Nominatim / OpenStreetMap)',
  })
  @ApiQuery({
    name: 'q',
    description: 'Address or place name to search',
    example: 'Madrid',
  })
  @ApiOkResponse({
    description:
      'Geocoding results (empty array when query is shorter than 3 characters)',
    type: GeocodeResultDto,
    isArray: true,
  })
  async search(@Query('q') q = ''): Promise<GeocodeResult[]> {
    return this.searchAddress.execute({ query: q });
  }
}
