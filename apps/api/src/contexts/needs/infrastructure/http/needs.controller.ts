import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
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
import { NeedView } from '../../application/need-view';
import { CreateNeedDto } from './dto';
import { CreateNeedResponseDto, NeedViewDto } from './response.dto';
import { JwtAuthGuard } from '../../../identity/infrastructure/http/jwt-auth.guard';
import { RequireCoordinatorGuard } from '../../../identity/infrastructure/http/require-coordinator.guard';
import { RequireAnyCoordinatorGuard } from '../../../identity/infrastructure/http/require-any-coordinator.guard';

@ApiTags('needs')
@Controller()
export class NeedsController {
  constructor(
    private readonly createNeed: CreateNeed,
    private readonly validateNeed: ValidateNeed,
    private readonly getPublicNeeds: GetPublicNeeds,
    private readonly getNeedsQueue: GetNeedsQueue,
  ) {}

  @Post('emergencies/:emergencyId/needs')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a need for an emergency (public — citizen self-registration)' })
  @ApiParam({ name: 'emergencyId', description: 'Emergency UUID', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Need created', type: CreateNeedResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body or UUID' })
  async create(
    @Param('emergencyId', ParseUUIDPipe) emergencyId: string,
    @Body() dto: CreateNeedDto,
  ): Promise<CreateNeedResponseDto> {
    return this.createNeed.execute({
      emergencyId,
      title: dto.title,
      category: dto.category,
      priority: dto.priority,
      requestedQuantity: dto.requestedQuantity ?? null,
      unit: dto.unit ?? null,
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
}
