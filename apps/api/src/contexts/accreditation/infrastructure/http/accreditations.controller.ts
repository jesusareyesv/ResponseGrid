import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { GrantAccreditation } from '../../application/grant-accreditation';
import { RevokeAccreditation } from '../../application/revoke-accreditation';
import {
  ListAccreditations,
  AccreditationView,
} from '../../application/list-accreditations';
import { GrantAccreditationDto } from './dto';
import { AccreditationExceptionFilter } from './accreditation-exception.filter';
import {
  JwtAuthGuard,
  AuthenticatedUser,
} from '../../../identity/infrastructure/http/jwt-auth.guard';
import { RequireAdminGuard } from '../../../identity/infrastructure/http/require-admin.guard';

class AccreditationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

class AccreditationViewDto implements AccreditationView {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty()
  scope!: 'global' | { emergencyId: string };

  @ApiProperty({ format: 'uuid' })
  grantedByUserId!: string;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  grantedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  evidence!: string | null;
}

@ApiTags('accreditations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireAdminGuard)
@UseFilters(AccreditationExceptionFilter)
@Controller('accreditations')
export class AccreditationsController {
  constructor(
    private readonly grant: GrantAccreditation,
    private readonly revoke: RevokeAccreditation,
    private readonly list: ListAccreditations,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Grant accreditation to an organization (admin only)',
  })
  @ApiCreatedResponse({
    description: 'Accreditation granted',
    type: AccreditationResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async grantAccreditation(
    @Body() dto: GrantAccreditationDto,
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<{ id: string }> {
    return this.grant.execute({
      organizationId: dto.organizationId,
      scope: dto.scope,
      grantedByUserId: req.user!.id,
      evidence: dto.evidence ?? null,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke an accreditation (admin only)' })
  @ApiParam({ name: 'id', description: 'Accreditation UUID', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Accreditation revoked' })
  @ApiNotFoundResponse({ description: 'Accreditation not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async revokeAccreditation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.revoke.execute({ accreditationId: id });
  }

  @Get()
  @ApiOperation({ summary: 'List accreditations (admin only)' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization UUID',
    type: String,
  })
  @ApiQuery({
    name: 'emergencyId',
    required: false,
    description: 'Filter by emergency UUID',
    type: String,
  })
  @ApiOkResponse({
    description: 'List of accreditations',
    type: [AccreditationViewDto],
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async listAccreditations(
    @Query('organizationId') organizationId?: string,
    @Query('emergencyId') emergencyId?: string,
  ): Promise<AccreditationView[]> {
    return this.list.execute({
      ...(organizationId !== undefined && { organizationId }),
      ...(emergencyId !== undefined && { emergencyId }),
    });
  }
}
