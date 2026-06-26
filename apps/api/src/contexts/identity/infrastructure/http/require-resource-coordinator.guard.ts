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
  RESOURCE_EMERGENCY_LOOKUP,
  type ResourceEmergencyLookup,
} from '../../domain/ports/resource-emergency-lookup';
import type { MembershipRepository } from '../../domain/ports/membership.repository';
import { MEMBERSHIP_REPOSITORY } from '../../domain/ports/membership.repository';
import { UserId } from '../../domain/user-id';
import { Role } from '../../domain/role';
import { AuthenticatedUser } from './jwt-auth.guard';

/**
 * Requires the authenticated user to be a Coordinator (or Admin) of the emergency
 * to which the resource identified by `:resourceId` belongs.
 *
 * Must be used AFTER JwtAuthGuard so that `request.user` is already populated.
 */
@Injectable()
export class RequireResourceCoordinatorGuard implements CanActivate {
  constructor(
    @Inject(RESOURCE_EMERGENCY_LOOKUP)
    private readonly resourceLookup: ResourceEmergencyLookup,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: AuthenticatedUser; params: { resourceId?: string } }
      >();

    if (!request.user)
      throw new UnauthorizedException('Authentication required');
    if (request.user.isAdmin) return true;

    const { resourceId } = request.params;
    if (!resourceId) throw new ForbiddenException('Resource context required');

    const emergencyId = await this.resourceLookup.findEmergencyId(resourceId);
    if (emergencyId === null) {
      throw new NotFoundException(`Resource ${resourceId} not found`);
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
