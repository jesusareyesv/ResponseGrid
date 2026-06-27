import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AuditQueryDto {
  @ApiPropertyOptional({ description: 'Filter by emergency ID' })
  @IsOptional()
  @IsUUID()
  emergencyId?: string;

  @ApiPropertyOptional({ description: 'Filter by actor user ID' })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity type (e.g. resource, need)',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Max results to return (default 100, max 500)',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: unknown }) =>
    Math.min(Number(value) || 100, 500),
  )
  limit?: number;

  @ApiPropertyOptional({
    description: 'Offset for pagination (default 0)',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class AuditEntryDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  actorUserId!: string | null;

  @ApiProperty()
  action!: string;

  @ApiPropertyOptional({ nullable: true })
  entityType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  emergencyId!: string | null;

  @ApiProperty()
  method!: string;

  @ApiProperty()
  path!: string;

  @ApiProperty()
  statusCode!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class AuditListResponseDto {
  @ApiProperty({ type: [AuditEntryDto] })
  entries!: AuditEntryDto[];

  @ApiProperty()
  total!: number;
}
