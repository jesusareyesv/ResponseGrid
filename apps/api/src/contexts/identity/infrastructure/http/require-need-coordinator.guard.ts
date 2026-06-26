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
  NEED_EMERGENCY_LOOKUP,
  type NeedEmergencyLookup,
} from '../../domain/ports/need-emergency-lookup';
import type { MembershipRepository } from '../../domain/ports/membership.repository';
import { MEMBERSHIP_REPOSITORY } from '../../domain/ports/membership.repository';
import { UserId } from '../../domain/user-id';
import { Role } from '../../domain/role';
import { AuthenticatedUser } from './jwt-auth.guard';

/**
 * Requires the authenticated user to be a Coordinator (or Admin) of the emergency
 * to which the need identified by `:needId` belongs.
 *
 * Must be used AFTER JwtAuthGuard so that `request.user` is already populated.
 */
@Injectable()
export class RequireNeedCoordinatorGuard implements CanActivate {
  constructor(
    @Inject(NEED_EMERGENCY_LOOKUP)
    private readonly needLookup: NeedEmergencyLookup,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: AuthenticatedUser; params: { needId?: string } }
      >();

    if (!request.user)
      throw new UnauthorizedException('Authentication required');
    if (request.user.isAdmin) return true;

    const { needId } = request.params;
    if (!needId) throw new ForbiddenException('Need context required');

    const emergencyId = await this.needLookup.findEmergencyId(needId);
    if (emergencyId === null) {
      throw new NotFoundException(`Need ${needId} not found`);
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
