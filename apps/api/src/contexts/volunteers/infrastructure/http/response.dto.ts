import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VolunteerSkill,
  Availability,
  Vehicle,
  VolunteerStatus,
} from '../../domain/volunteer-enums';

export class RegisterVolunteerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class VolunteerViewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  emergencyId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  contact!: string;

  @ApiProperty()
  municipality!: string;

  @ApiProperty({ enum: VolunteerSkill, isArray: true })
  skills!: VolunteerSkill[];

  @ApiProperty({ enum: Availability })
  availability!: Availability;

  @ApiProperty({ enum: Vehicle })
  vehicle!: Vehicle;

  @ApiProperty({ enum: VolunteerStatus })
  status!: VolunteerStatus;

  @ApiProperty()
  consentAccepted!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class VolunteerProfileOrNullDto {
  @ApiPropertyOptional({ type: VolunteerViewDto })
  volunteer?: VolunteerViewDto | null;
}
