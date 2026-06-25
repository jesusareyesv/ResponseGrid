import { ApiProperty } from '@nestjs/swagger';

export class GeocodeResultDto {
  @ApiProperty({ example: 'Madrid, Community of Madrid, Spain' })
  address!: string;

  @ApiProperty({ example: 40.4165, description: 'Decimal degrees latitude' })
  latitude!: number;

  @ApiProperty({ example: -3.70256, description: 'Decimal degrees longitude' })
  longitude!: number;
}
