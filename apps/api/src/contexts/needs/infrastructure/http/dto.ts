import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NeedCategory, Priority } from '../../domain/need-enums';

export class CreateNeedDto {
  @ApiProperty({ example: 'Alimentos para 50 familias', minLength: 2 })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ enum: NeedCategory, example: NeedCategory.Food })
  @IsEnum(NeedCategory)
  category!: NeedCategory;

  @ApiProperty({ enum: Priority, example: Priority.High })
  @IsEnum(Priority)
  priority!: Priority;

  @ApiPropertyOptional({ example: 50, description: 'Quantity requested (optional)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestedQuantity?: number;

  @ApiPropertyOptional({ example: 'boxes', description: 'Unit of measurement (optional)' })
  @IsOptional()
  @IsString()
  unit?: string;
}
