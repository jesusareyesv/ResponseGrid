import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  TASK_EMERGENCY_LOOKUP,
  type TaskEmergencyLookup,
} from '../../domain/ports/task-emergency-lookup';
import type { MembershipRepository } from '../../domain/ports/membership.repository';
import { MEMBERSHIP_REPOSITORY } from '../../domain/ports/membership.repository';
import { UserId } from '../../domain/user-id';
import { Role } from '../../domain/role';
import { AuthenticatedUser } from './jwt-auth.guard';

/**
 * Requires the authenticated user to be a Coordinator (or Admin) of the emergency
 * to which the task identified by `:taskId` belongs.
 *
 * Must be used AFTER JwtAuthGuard so that `request.user` is already populated.
 */
@Injectable()
export class RequireTaskCoordinatorGuard implements CanActivate {
  constructor(
    @Inject(TASK_EMERGENCY_LOOKUP)
    private readonly taskLookup: TaskEmergencyLookup,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: AuthenticatedUser; params: { taskId?: string } }
      >();

    if (!request.user)
      throw new UnauthorizedException('Authentication required');
    if (request.user.isAdmin) return true;

    const { taskId } = request.params;
    if (!taskId) throw new ForbiddenException('Task context required');

    const emergencyId = await this.taskLookup.findEmergencyId(taskId);
    if (emergencyId === null) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const hasRole = await this.membershipRepo.hasRole(
      UserId.fromString(request.user.id),
      emergencyId,
      Role.Coordinator,
    );

    if (!hasRole) {
      throw new ForbiddenException(
        'Coordinator role required for this emergency',
      );
    }
    return true;
  }
}
