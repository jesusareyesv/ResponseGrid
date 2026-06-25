import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard, AuthenticatedUser } from '../../../identity/infrastructure/http/jwt-auth.guard';
import { CreateOrganization } from '../../application/create-organization';
import { ListMyOrganizations } from '../../application/list-my-organizations';
import { ListOrganizations } from '../../application/list-organizations';
import {
  CreateOrganizationDto,
  CreateOrganizationResponseDto,
  OrganizationViewDto,
} from './dto';

type AuthedRequest = ExpressRequest & { user: AuthenticatedUser };

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrganization: CreateOrganization,
    private readonly listMyOrganizations: ListMyOrganizations,
    private readonly listOrganizations: ListOrganizations,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new organization (authenticated users)' })
  @ApiCreatedResponse({ description: 'Organization created', type: CreateOrganizationResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  async create(
    @Body() dto: CreateOrganizationDto,
    @Request() req: AuthedRequest,
  ): Promise<CreateOrganizationResponseDto> {
    return this.createOrganization.execute({
      name: dto.name,
      type: dto.type,
      taxId: dto.taxId ?? null,
      contactEmail: dto.contactEmail ?? null,
      creatorUserId: req.user.id,
    });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organizations the authenticated user belongs to' })
  @ApiOkResponse({ description: 'User organizations', type: [OrganizationViewDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  async mine(@Request() req: AuthedRequest): Promise<OrganizationViewDto[]> {
    return this.listMyOrganizations.execute({ userId: req.user.id });
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations (public)' })
  @ApiOkResponse({ description: 'All organizations', type: [OrganizationViewDto] })
  async list(): Promise<OrganizationViewDto[]> {
    return this.listOrganizations.execute();
  }
}
