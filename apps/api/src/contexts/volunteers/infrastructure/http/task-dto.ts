import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsNumber,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VolunteerSkill } from '../../domain/volunteer-enums';
import { TaskStatus } from '../../domain/task';

export class LocationDto {
  @ApiProperty({ example: 'Calle Mayor 1, Valencia' })
  @IsString()
  @MinLength(1)
  address!: string;

  @ApiProperty({ example: 39.4699 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: -0.3763 })
  @IsNumber()
  longitude!: number;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Deliver supplies to zone 3' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({
    example: 'Transport 200 water bottles to the distribution point',
  })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto | null;

  @ApiPropertyOptional({ enum: VolunteerSkill })
  @IsOptional()
  @IsEnum(VolunteerSkill)
  requiredSkill?: VolunteerSkill | null;
}

export class AssignVolunteerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  volunteerId!: string;
}

export class GetTasksQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
