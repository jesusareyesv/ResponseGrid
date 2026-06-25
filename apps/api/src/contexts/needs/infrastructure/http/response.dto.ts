import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NeedCategory, Priority, NeedStatus } from '../../domain/need-enums';

export class CreateNeedResponseDto {
  @ApiProperty({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;
}

export class NeedViewDto {
  @ApiProperty({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  emergencyId!: string;

  @ApiProperty({ example: 'Alimentos para 50 familias' })
  title!: string;

  @ApiProperty({ enum: NeedCategory, example: NeedCategory.Food })
  category!: NeedCategory;

  @ApiProperty({ enum: Priority, example: Priority.High })
  priority!: Priority;

  @ApiPropertyOptional({ example: 50, nullable: true })
  requestedQuantity!: number | null;

  @ApiPropertyOptional({ example: 'boxes', nullable: true })
  unit!: string | null;

  @ApiProperty({ enum: NeedStatus, example: NeedStatus.Pending })
  status!: NeedStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: string;
}
