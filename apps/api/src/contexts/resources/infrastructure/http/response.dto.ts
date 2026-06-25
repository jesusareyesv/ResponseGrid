import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType, ResourceStage, VerificationLevel, PublicStatus } from '../../domain/resource-enums';

export class RegisterResourceResponseDto {
  @ApiProperty({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;
}

export class LocationViewDto {
  @ApiProperty({ example: 'Calle Mayor 1, Valencia' })
  address!: string;

  @ApiProperty({ example: 39.4699 })
  latitude!: number;

  @ApiProperty({ example: -0.3763 })
  longitude!: number;
}

export class ResourceViewDto {
  @ApiProperty({ format: 'uuid', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ enum: ResourceType, example: ResourceType.CollectionPoint })
  type!: ResourceType;

  @ApiProperty({ enum: ResourceStage, example: ResourceStage.Origin })
  stage!: ResourceStage;

  @ApiProperty({ example: 'Cruz Roja Madrid' })
  name!: string;

  @ApiPropertyOptional({ example: 'Centro de acopio principal', nullable: true })
  description!: string | null;

  @ApiProperty({ type: LocationViewDto })
  location!: LocationViewDto;

  @ApiProperty({ enum: VerificationLevel, example: VerificationLevel.Verified })
  verificationLevel!: VerificationLevel;

  @ApiProperty({ enum: PublicStatus, example: PublicStatus.Active })
  publicStatus!: PublicStatus;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerOrganizationId!: string | null;
}
