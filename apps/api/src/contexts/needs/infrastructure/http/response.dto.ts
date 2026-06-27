import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, NeedCategory, NeedStatus } from '../../domain/need-enums';

export class CreateNeedResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id!: string;
}

export class NeedLocationResponseDto {
  @ApiProperty({ example: '123 Main Street, Caracas' })
  address!: string;

  @ApiProperty({ example: 10.4806 })
  latitude!: number;

  @ApiProperty({ example: -66.9036 })
  longitude!: number;
}

export class NeedItemResponseDto {
  @ApiProperty({ example: 'Water bottles' })
  name!: string;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiPropertyOptional({ example: 'liters', nullable: true, type: String })
  unit!: string | null;

  @ApiProperty({ enum: NeedCategory, example: NeedCategory.Water })
  category!: NeedCategory;
}

export class NeedViewDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  emergencyId!: string;

  @ApiProperty({ example: 'Alimentos para 50 familias' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Descripción detallada',
    nullable: true,
    type: String,
  })
  description!: string | null;

  @ApiProperty({ type: NeedLocationResponseDto })
  location!: NeedLocationResponseDto;

  @ApiProperty({ enum: Priority, example: Priority.High })
  priority!: Priority;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  requesterOrganizationId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  managingOrganizationId!: string | null;

  @ApiProperty({ type: [NeedItemResponseDto] })
  items!: NeedItemResponseDto[];

  @ApiProperty({ enum: NeedStatus, example: NeedStatus.Pending })
  status!: NeedStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: string;
}
