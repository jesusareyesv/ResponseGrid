import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GrantAccreditationDto {
  @ApiProperty({ format: 'uuid', description: 'Organization to accredit' })
  @IsUUID()
  organizationId!: string;

  /**
   * Either the string "global" or an object { emergencyId: "<uuid>" }.
   *
   * Class-validator cannot validate a discriminated union precisely with
   * built-in decorators; structural validation is delegated to the use case.
   * `@IsNotEmpty()` ensures the field survives whitelist stripping.
   */
  @ApiProperty({
    description: 'Scope: "global" or { emergencyId: "<uuid>" }',
    oneOf: [
      { type: 'string', enum: ['global'] },
      {
        type: 'object',
        properties: { emergencyId: { type: 'string', format: 'uuid' } },
        required: ['emergencyId'],
      },
    ],
  })
  @IsNotEmpty()
  scope!: 'global' | { emergencyId: string };

  @ApiPropertyOptional({ description: 'Free-text evidence / justification' })
  @IsOptional()
  @IsString()
  evidence?: string;
}
