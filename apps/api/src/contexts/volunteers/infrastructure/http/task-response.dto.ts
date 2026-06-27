import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VolunteerSkill } from '../../domain/volunteer-enums';
import { TaskStatus, AssignmentStatus } from '../../domain/task';

export class TaskAssignmentViewDto {
  @ApiProperty({ format: 'uuid' })
  volunteerId!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  volunteerName!: string | null;

  @ApiProperty()
  assignedAt!: Date;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  checkedInAt!: Date | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  checkedOutAt!: Date | null;

  @ApiProperty({ enum: AssignmentStatus })
  status!: AssignmentStatus;
}

export class TaskLocationDto {
  @ApiProperty()
  address!: string;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;
}

export class TaskViewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  emergencyId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ type: TaskLocationDto, nullable: true })
  location!: TaskLocationDto | null;

  @ApiPropertyOptional({ enum: VolunteerSkill, nullable: true })
  requiredSkill!: VolunteerSkill | null;

  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;

  @ApiProperty({ format: 'uuid' })
  createdByUserId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: TaskAssignmentViewDto, isArray: true })
  assignments!: TaskAssignmentViewDto[];
}

export class CreateTaskResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class MyTaskViewDto extends TaskViewDto {
  @ApiProperty({ enum: AssignmentStatus })
  myAssignmentStatus!: AssignmentStatus;
}
