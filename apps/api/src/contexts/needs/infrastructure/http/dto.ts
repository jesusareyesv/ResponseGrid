import {
  ArrayMinSize,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NeedCategory, Priority } from '../../domain/need-enums';

export class NeedItemDto {
  @ApiProperty({
    example: 'Water bottles',
    description: 'Name of the item needed',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 100,
    description: 'Quantity needed (positive integer)',
  })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({
    example: 'liters',
    description: 'Unit of measurement (optional)',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ enum: NeedCategory, example: NeedCategory.Water })
  @IsEnum(NeedCategory)
  category!: NeedCategory;
}

export class NeedLocationDto {
  @ApiProperty({ example: '123 Main Street, Caracas, Venezuela' })
  @IsString()
  @MinLength(2)
  address!: string;

  @ApiProperty({ example: 10.4806, description: 'Latitude (-90 to 90)' })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: -66.9036, description: 'Longitude (-180 to 180)' })
  @IsLongitude()
  longitude!: number;
}

export class CreateNeedDto {
  @ApiProperty({ example: 'Alimentos para 50 familias', minLength: 2 })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({ example: 'Descripción detallada de la necesidad' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: NeedLocationDto })
  @ValidateNested()
  @Type(() => NeedLocationDto)
  location!: NeedLocationDto;

  @ApiProperty({ enum: Priority, example: Priority.High })
  @IsEnum(Priority)
  priority!: Priority;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Organization on whose behalf the request is made (optional)',
  })
  @IsOptional()
  @IsUUID()
  requesterOrganizationId?: string;

  @ApiProperty({
    type: [NeedItemDto],
    description: 'List of items needed (minimum 1)',
    minItems: 1,
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NeedItemDto)
  items!: NeedItemDto[];
}

export class AssignNeedManagerDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID of the organization that will manage this need',
  })
  @IsUUID()
  organizationId!: string;
}
