import {
  IsBoolean,
  IsEnum,
  IsString,
  MinLength,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../../domain/volunteer-enums';

export class RegisterVolunteerDto {
  @ApiProperty({ example: 'Ana García', minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsString()
  @MinLength(1)
  contact!: string;

  @ApiProperty({ example: 'Valencia' })
  @IsString()
  @MinLength(1)
  municipality!: string;

  @ApiProperty({
    enum: VolunteerSkill,
    isArray: true,
    example: [VolunteerSkill.Medical, VolunteerSkill.Driving],
  })
  @IsArray()
  @IsEnum(VolunteerSkill, { each: true })
  skills!: VolunteerSkill[];

  @ApiProperty({ enum: Availability, example: Availability.Immediate })
  @IsEnum(Availability)
  availability!: Availability;

  @ApiProperty({ enum: Vehicle, example: Vehicle.Car })
  @IsEnum(Vehicle)
  vehicle!: Vehicle;

  @ApiProperty({
    example: true,
    description: 'Must be true to register as a volunteer',
  })
  @IsBoolean()
  consentAccepted!: boolean;
}

export class UpdateVolunteerStatusDto {
  @ApiProperty({ enum: VolunteerStatus, example: VolunteerStatus.Assigned })
  @IsEnum(VolunteerStatus)
  status!: VolunteerStatus;
}

export class VolunteerRosterFiltersDto {
  @ApiPropertyOptional({ enum: VolunteerSkill })
  @IsOptional()
  @IsEnum(VolunteerSkill)
  skill?: VolunteerSkill;

  @ApiPropertyOptional({ enum: Availability })
  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;

  @ApiPropertyOptional({ enum: Vehicle })
  @IsOptional()
  @IsEnum(Vehicle)
  vehicle?: Vehicle;

  @ApiPropertyOptional({ enum: VolunteerStatus })
  @IsOptional()
  @IsEnum(VolunteerStatus)
  status?: VolunteerStatus;
}
