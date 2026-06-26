import { ApiProperty } from '@nestjs/swagger';

export class NeedsMetricsDto {
  @ApiProperty({
    description: 'Total needs registered for this emergency',
    example: 10,
  })
  total!: number;

  @ApiProperty({ description: 'Open needs: pending + validated', example: 7 })
  open!: number;

  @ApiProperty({ description: 'Closed needs: fulfilled', example: 2 })
  closed!: number;
}

export class ResourcesMetricsDto {
  @ApiProperty({
    description: 'Total resources registered for this emergency',
    example: 5,
  })
  total!: number;

  @ApiProperty({
    description: 'Active logistic points (publicStatus = Active)',
    example: 3,
  })
  active!: number;

  @ApiProperty({
    description: 'Resources pending publication (publicStatus = Hidden)',
    example: 2,
  })
  pending!: number;
}

export class EmergencyMetricsDto {
  @ApiProperty({ type: NeedsMetricsDto })
  needs!: NeedsMetricsDto;

  @ApiProperty({ type: ResourcesMetricsDto })
  resources!: ResourcesMetricsDto;
}
