import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CreateNeed } from '../../application/create-need';
import { ValidateNeed } from '../../application/validate-need';
import { GetPublicNeeds } from '../../application/get-public-needs';
import { GetNeedsQueue } from '../../application/get-needs-queue';
import { AssignNeedManager } from '../../application/assign-need-manager';
import { NeedView } from '../../application/need-view';
import { CreateNeedDto, AssignNeedManagerDto } from './dto';
import { CreateNeedResponseDto, NeedViewDto } from './response.dto';
import { JwtAuthGuard } from '../../../identity/infrastructure/http/jwt-auth.guard';
import { RequireCoordinatorGuard } from '../../../identity/infrastructure/http/require-coordinator.guard';
import { RequireAnyCoordinatorGuard } from '../../../identity/infrastructure/http/require-any-coordinator.guard';

interface AuthenticatedRequest extends Express.Request {
  user: { id: string; email: string; isAdmin: boolean };
}

@ApiTags('needs')
@Controller()
export class NeedsController {
  constructor(
    private readonly createNeed: CreateNeed,
    private readonly validateNeed: ValidateNeed,
    private readonly getPublicNeeds: GetPublicNeeds,
    private readonly getNeedsQueue: GetNeedsQueue,
    private readonly assignNeedManager: AssignNeedManager,
  ) {}

  @Post('emergencies/:emergencyId/needs')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a need for an emergency (authenticated requester)' })
  @ApiParam({ name: 'emergencyId', description: 'Emergency UUID', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Need created', type: CreateNeedResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body or UUID' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  async create(
    @Param('emergencyId', ParseUUIDPipe) emergencyId: string,
    @Body() dto: CreateNeedDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CreateNeedResponseDto> {
    return this.createNeed.execute({
      emergencyId,
      requesterUserId: req.user.id,
      requesterOrganizationId: dto.requesterOrganizationId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      location: {
        address: dto.location.address,
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
      },
      priority: dto.priority,
      items: dto.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit ?? null,
        category: i.category,
      })),
    });
  }

  @Get('emergencies/:emergencyId/public/needs')
  @ApiOperation({ summary: 'List validated needs for an emergency (public)' })
  @ApiParam({ name: 'emergencyId', description: 'Emergency UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'List of validated needs', type: [NeedViewDto] })
  async listPublic(
    @Param('emergencyId', ParseUUIDPipe) emergencyId: string,
  ): Promise<NeedView[]> {
    return this.getPublicNeeds.execute({ emergencyId });
  }

  @Get('emergencies/:emergencyId/needs/queue')
  @UseGuards(JwtAuthGuard, RequireCoordinatorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending needs queue for an emergency (coordinator only)' })
  @ApiParam({ name: 'emergencyId', description: 'Emergency UUID', format: 'uuid' })
  @ApiOkResponse({ description: 'List of pending needs', type: [NeedViewDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Coordinator role required for this emergency' })
  async listQueue(
    @Param('emergencyId', ParseUUIDPipe) emergencyId: string,
  ): Promise<NeedView[]> {
    return this.getNeedsQueue.execute({ emergencyId });
  }

  @Post('needs/:needId/validate')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RequireAnyCoordinatorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a need (coordinator only)' })
  @ApiParam({ name: 'needId', description: 'Need UUID', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Need validated' })
  @ApiNotFoundResponse({ description: 'Need not found' })
  @ApiBadRequestResponse({ description: 'Need is not in pending status' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Coordinator role required' })
  async validate(@Param('needId', ParseUUIDPipe) needId: string): Promise<void> {
    await this.validateNeed.execute({ needId });
  }

  @Post('needs/:needId/assign-manager')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RequireAnyCoordinatorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a managing organization to a need (coordinator only)' })
  @ApiParam({ name: 'needId', description: 'Need UUID', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Manager assigned' })
  @ApiNotFoundResponse({ description: 'Need not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Coordinator role required' })
  async assignManager(
    @Param('needId', ParseUUIDPipe) needId: string,
    @Body() dto: AssignNeedManagerDto,
  ): Promise<void> {
    await this.assignNeedManager.execute({
      needId,
      organizationId: dto.organizationId,
    });
  }
}
