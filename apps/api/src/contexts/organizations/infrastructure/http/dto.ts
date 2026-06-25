import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationType } from '../../domain/organization-enums';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Red Cross Spain' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: OrganizationType, example: OrganizationType.Ngo })
  @IsEnum(OrganizationType)
  type!: OrganizationType;

  @ApiPropertyOptional({ example: 'ES-12345678' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 'contact@org.example' })
  @IsOptional()
  @IsString()
  contactEmail?: string;
}

export class CreateOrganizationResponseDto {
  @ApiProperty({ description: 'New organization UUID' })
  id!: string;
}

export class OrganizationViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: OrganizationType })
  type!: string;

  @ApiProperty()
  verificationLevel!: string;
}
